package com.collectx.dunning.service;

import com.collectx.dunning.dto.AttemptRequestDTO;
import com.collectx.dunning.dto.AttemptResponseDTO;
import com.collectx.dunning.entity.ContactAttempt;
import com.collectx.dunning.entity.ContactPolicy;
import com.collectx.dunning.entity.enums.AttemptOutcome;
import com.collectx.dunning.entity.enums.Channel;
import com.collectx.dunning.entity.enums.YesNoFlag;
import com.collectx.dunning.exception.NotFoundException;
import com.collectx.dunning.exception.PolicyViolationException;
import com.collectx.dunning.feign.PortfolioClient;
import com.collectx.dunning.repository.AttemptRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DunningService {

    private static final Logger log = LoggerFactory.getLogger(DunningService.class);

    private final AttemptRepository attemptRepo;
    private final ConsentService    consentService;
    private final PolicyService     policyService;

    @Autowired(required = false)
    private PortfolioClient portfolioClient;

    // ── LOG CONTACT ATTEMPT ───────────────────────────────────────────────────
    @Transactional
    public AttemptResponseDTO makeAttempt(AttemptRequestDTO req) {
        log.info("Logging contact attempt loan={} channel={} bucket={}", req.getLoanAccountId(), req.getChannel(), req.getBucket());

        // ── Validate Loan ID exists in Portfolio ──────────────────────────────
        if (portfolioClient != null) {
            try {
                boolean exists = portfolioClient.loanExists(req.getLoanAccountId());
                if (!exists) {
                    throw new NotFoundException("Loan account ID " + req.getLoanAccountId() + " does not exist in portfolio");
                }
                log.debug("Loan validation passed for loanId={}", req.getLoanAccountId());
            } catch (NotFoundException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Could not validate loan={} — portfolio service unreachable: {}", req.getLoanAccountId(), e.getMessage());
            }
        }

        Channel ch = Channel.valueOf(req.getChannel().toUpperCase());

        // --- Fetch policy (null-safe: skip rule checks if no policy configured yet)
        ContactPolicy policy = policyService.findPolicyOrNull(req.getBucket());

        if (policy != null) {

            // 1️⃣ DoNotCall flag
            if (ch == Channel.CALL && policy.getDoNotCallFlag() == YesNoFlag.YES) {
                throw new PolicyViolationException("DO_NOT_CALL — CALL channel is blocked for bucket " + req.getBucket());
            }

            // 2️⃣ Consent opt-out
            if (!consentService.isChannelAllowed(req.getCustomerId(), ch)) {
                throw new PolicyViolationException("CONSENT_OPTOUT — customer " + req.getCustomerId() + " opted out of " + ch);
            }

            // 3️⃣ Max attempts per day
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime now        = LocalDateTime.now();
            int attemptsToday = attemptRepo
                    .findAttemptsInWindow(req.getLoanAccountId(), startOfDay, now).size();
            if (attemptsToday >= policy.getMaxAttemptsPerDay()) {
                throw new PolicyViolationException("MAX_ATTEMPTS_REACHED — " +
                        attemptsToday + "/" + policy.getMaxAttemptsPerDay() + " attempts used today");
            }

            // 4️⃣ Min gap between attempts
            if (policy.getMinGapMinutes() != null && policy.getMinGapMinutes() > 0) {
                List<ContactAttempt> last = attemptRepo
                        .findTop1ByLoanAccountIdOrderByAttemptTimeDesc(req.getLoanAccountId());
                if (!last.isEmpty()) {
                    long elapsed = Duration.between(last.get(0).getAttemptTime(), now).toMinutes();
                    if (elapsed < policy.getMinGapMinutes()) {
                        throw new PolicyViolationException("MIN_GAP_NOT_MET — wait " +
                                (policy.getMinGapMinutes() - elapsed) + " more minute(s) before next attempt");
                    }
                }
            }
        }

        // --- All checks passed: save attempt
        ContactAttempt attempt = new ContactAttempt();
        attempt.setLoanAccountId(req.getLoanAccountId());
        attempt.setAgentId(req.getAgentId());
        attempt.setChannel(ch);
        attempt.setOutcome(req.getOutcome() != null
                ? AttemptOutcome.valueOf(req.getOutcome().toUpperCase())
                : AttemptOutcome.CONNECTED);
        attempt.setNotes(req.getNotes());
        attempt.setAttemptTime(req.getAttemptTime() != null ? req.getAttemptTime() : LocalDateTime.now());

        attempt = attemptRepo.save(attempt);
        return toDTO(attempt);
    }

    // ── LIST ALL ATTEMPTS ─────────────────────────────────────────────────────
    public List<AttemptResponseDTO> getAllAttempts() {
        return attemptRepo.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── LIST ATTEMPTS FOR ONE LOAN ────────────────────────────────────────────
    public List<AttemptResponseDTO> getAttemptsByLoan(Long loanId) {
        return attemptRepo.findByLoanAccountIdOrderByAttemptTimeDesc(loanId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private AttemptResponseDTO toDTO(ContactAttempt a) {
        return AttemptResponseDTO.builder()
                .attemptId(a.getAttemptId())
                .loanAccountId(a.getLoanAccountId())
                .agentId(a.getAgentId())
                .channel(a.getChannel() != null ? a.getChannel().name() : null)
                .outcome(a.getOutcome() != null ? a.getOutcome().name() : null)
                .notes(a.getNotes())
                .attemptTime(a.getAttemptTime())
                .build();
    }
}
