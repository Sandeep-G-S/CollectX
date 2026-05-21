package com.collectx.dunning.service;

import com.collectx.dunning.dto.NextSuggestionResponseDTO;
import com.collectx.dunning.entity.ContactAttempt;
import com.collectx.dunning.entity.ContactPolicy;
import com.collectx.dunning.entity.enums.Channel;
import com.collectx.dunning.entity.enums.YesNoFlag;
import com.collectx.dunning.exception.NotFoundException;
import com.collectx.dunning.repository.AttemptRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(OrchestrationService.class);

    private final PolicyService     policyService;
    private final ConsentService    consentService;
    private final AttemptRepository attemptRepo;

    /**
     * Given a loan ID + bucket + customer, suggest the best next contact channel.
     * The frontend already knows these values from the loan table, so they are
     * passed as query params (avoids a round-trip to portfolio service).
     *
     * Returns:
     *   suggestedChannel = best eligible channel, or null if none available
     *   reasonOrNote     = "ELIGIBLE" | "MAX_ATTEMPTS_REACHED" | "MIN_GAP_NOT_MET" | "NO_ELIGIBLE_CHANNEL"
     *   eligibleAt       = when the next attempt is allowed (for gap/limit cases)
     */
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISOR')")
    public NextSuggestionResponseDTO nextSuggestion(Long loanAccountId,
                                                     String bucket,
                                                     Long customerId) {

        ContactPolicy policy = policyService.findPolicyOrNull(bucket);

        if (policy == null) {
            // No policy configured — any channel is eligible
            return NextSuggestionResponseDTO.builder()
                    .loanAccountId(loanAccountId)
                    .bucket(bucket)
                    .preferredChannels(List.of())
                    .suggestedChannel("CALL")
                    .reasonOrNote("NO_POLICY_CONFIGURED — defaulting to CALL")
                    .eligibleAt(LocalDateTime.now())
                    .build();
        }

        List<String> preferredRaw   = PolicyService.deserialize(policy.getPreferredChannels());
        List<Channel> preferredList = preferredRaw.stream()
                .map(s -> {
                    try { return Channel.valueOf(s.toUpperCase()); }
                    catch (IllegalArgumentException e) { return null; }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();

        // 1️⃣ Check daily limit
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        int attemptsToday = attemptRepo
                .findAttemptsInWindow(loanAccountId, startOfDay, now).size();

        if (attemptsToday >= policy.getMaxAttemptsPerDay()) {
            return NextSuggestionResponseDTO.builder()
                    .loanAccountId(loanAccountId)
                    .bucket(bucket)
                    .preferredChannels(preferredRaw)
                    .suggestedChannel(null)
                    .reasonOrNote("MAX_ATTEMPTS_REACHED — " + attemptsToday + "/" + policy.getMaxAttemptsPerDay() + " used today")
                    .eligibleAt(LocalDate.now().plusDays(1).atStartOfDay())
                    .build();
        }

        // 2️⃣ Check min-gap since last attempt
        if (policy.getMinGapMinutes() != null && policy.getMinGapMinutes() > 0) {
            List<ContactAttempt> last = attemptRepo
                    .findTop1ByLoanAccountIdOrderByAttemptTimeDesc(loanAccountId);
            if (!last.isEmpty()) {
                long elapsed = Duration.between(last.get(0).getAttemptTime(), now).toMinutes();
                if (elapsed < policy.getMinGapMinutes()) {
                    LocalDateTime eligibleAt = last.get(0).getAttemptTime()
                            .plusMinutes(policy.getMinGapMinutes());
                    return NextSuggestionResponseDTO.builder()
                            .loanAccountId(loanAccountId)
                            .bucket(bucket)
                            .preferredChannels(preferredRaw)
                            .suggestedChannel(null)
                            .reasonOrNote("MIN_GAP_NOT_MET — eligible in " +
                                    (policy.getMinGapMinutes() - elapsed) + " min(s)")
                            .eligibleAt(eligibleAt)
                            .build();
                }
            }
        }

        // 3️⃣ Walk preferred channels, pick first one that passes consent + DoNotCall
        for (Channel ch : preferredList) {
            if (ch == Channel.CALL && policy.getDoNotCallFlag() == YesNoFlag.YES) continue;
            if (!consentService.isChannelAllowed(customerId, ch)) continue;

            return NextSuggestionResponseDTO.builder()
                    .loanAccountId(loanAccountId)
                    .bucket(bucket)
                    .preferredChannels(preferredRaw)
                    .suggestedChannel(ch.name())
                    .reasonOrNote("ELIGIBLE")
                    .eligibleAt(now)
                    .build();
        }

        // 4️⃣ All channels blocked
        return NextSuggestionResponseDTO.builder()
                .loanAccountId(loanAccountId)
                .bucket(bucket)
                .preferredChannels(preferredRaw)
                .suggestedChannel(null)
                .reasonOrNote("NO_ELIGIBLE_CHANNEL — all blocked by consent or DoNotCall policy")
                .eligibleAt(null)
                .build();
    }
}
