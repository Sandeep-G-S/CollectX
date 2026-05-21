package com.collectx.dunning.service;

import com.collectx.dunning.dto.PolicyRequestDTO;
import com.collectx.dunning.dto.PolicyResponseDTO;
import com.collectx.dunning.dto.PolicyUpdateDTO;
import com.collectx.dunning.entity.ContactPolicy;
import com.collectx.dunning.entity.enums.YesNoFlag;
import com.collectx.dunning.exception.NotFoundException;
import com.collectx.dunning.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PolicyService {

    private static final Logger log = LoggerFactory.getLogger(PolicyService.class);

    private final PolicyRepository policyRepo;

    // ── CREATE ────────────────────────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PolicyResponseDTO create(PolicyRequestDTO req) {
        policyRepo.findByBucket(req.getBucket()).ifPresent(p -> {
            throw new IllegalArgumentException("Policy already exists for bucket: " + req.getBucket());
        });

        ContactPolicy p = new ContactPolicy();
        p.setBucket(req.getBucket());
        p.setMaxAttemptsPerDay(req.getMaxAttemptsPerDay());
        p.setMinGapMinutes(req.getMinGapMinutes() != null ? req.getMinGapMinutes() : 0);
        p.setPreferredChannels(serialize(req.getPreferredChannels()));
        p.setDoNotCallFlag(Boolean.TRUE.equals(req.getDoNotCall()) ? YesNoFlag.YES : YesNoFlag.NO);

        return toDTO(policyRepo.save(p));
    }

    // ── UPDATE (patch — null fields = unchanged) ──────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PolicyResponseDTO update(String bucket, PolicyUpdateDTO req) {
        ContactPolicy p = policyRepo.findByBucket(bucket)
                .orElseThrow(() -> new NotFoundException("No policy for bucket: " + bucket));

        if (req.getMaxAttemptsPerDay() != null) p.setMaxAttemptsPerDay(req.getMaxAttemptsPerDay());
        if (req.getMinGapMinutes()    != null) p.setMinGapMinutes(req.getMinGapMinutes());
        if (req.getPreferredChannels()!= null) p.setPreferredChannels(serialize(req.getPreferredChannels()));
        if (req.getDoNotCall()        != null) p.setDoNotCallFlag(req.getDoNotCall() ? YesNoFlag.YES : YesNoFlag.NO);

        return toDTO(policyRepo.save(p));
    }

    // ── GET BY BUCKET ─────────────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE','SUPERVISOR','AGENT')")
    public PolicyResponseDTO getByBucket(String bucket) {
        return toDTO(policyRepo.findByBucket(bucket)
                .orElseThrow(() -> new NotFoundException("No policy for bucket: " + bucket)));
    }

    // ── Internal helper (used by DunningService + OrchestrationService) ───────
    public ContactPolicy findPolicyOrNull(String bucket) {
        return policyRepo.findByBucket(bucket).orElse(null);
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────
    PolicyResponseDTO toDTO(ContactPolicy p) {
        return PolicyResponseDTO.builder()
                .policyId(p.getPolicyId())
                .bucket(p.getBucket())
                .maxAttemptsPerDay(p.getMaxAttemptsPerDay())
                .minGapMinutes(p.getMinGapMinutes())
                .preferredChannels(deserialize(p.getPreferredChannels()))
                .doNotCall(p.getDoNotCallFlag() == YesNoFlag.YES)
                .build();
    }

    /** Stores as comma-separated string: "CALL,INAPP,SMS" */
    private String serialize(List<String> channels) {
        if (channels == null || channels.isEmpty()) return "";
        return String.join(",", channels);
    }

    /** Parses comma-separated string back to list */
    static List<String> deserialize(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.asList(raw.split(","));
    }
}
