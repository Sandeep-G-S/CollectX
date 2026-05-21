package com.collectx.dunning.service;

import com.collectx.dunning.dto.ConsentRequestDTO;
import com.collectx.dunning.dto.ConsentResponseDTO;
import com.collectx.dunning.entity.ConsentPref;
import com.collectx.dunning.entity.enums.Channel;
import com.collectx.dunning.entity.enums.ConsentStatus;
import com.collectx.dunning.repository.ConsentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsentService {

    private static final Logger log = LoggerFactory.getLogger(ConsentService.class);

    private final ConsentRepository consentRepo;

    // ── UPSERT (create or update) ─────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    @Transactional
    public ConsentResponseDTO upsert(ConsentRequestDTO req) {
        Channel       ch     = Channel.valueOf(req.getChannel().toUpperCase());
        ConsentStatus status = ConsentStatus.valueOf(req.getStatus().toUpperCase());

        ConsentPref consent = consentRepo
                .findByCustomerIdAndChannel(req.getCustomerId(), ch)
                .orElseGet(ConsentPref::new);

        if (consent.getConsentId() == null) {   // new record
            consent.setCustomerId(req.getCustomerId());
            consent.setChannel(ch);
        }
        consent.setStatus(status);
        consent.setUpdatedDate(LocalDate.now());
        consent = consentRepo.save(consent);

        return toDTO(consent);
    }

    // ── LIST BY CUSTOMER ──────────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE','SUPERVISOR')")
    public List<ConsentResponseDTO> listByCustomer(Long customerId) {
        return consentRepo.findByCustomerId(customerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── Internal helper — used by DunningService + OrchestrationService ───────
    /** Returns false only when an explicit OPTOUT record exists for this customer + channel. */
    public boolean isChannelAllowed(Long customerId, Channel channel) {
        return consentRepo.findByCustomerIdAndChannel(customerId, channel)
                .map(c -> c.getStatus() != ConsentStatus.OPTOUT)
                .orElse(true); // no record = default allow
    }

    private ConsentResponseDTO toDTO(ConsentPref c) {
        return ConsentResponseDTO.builder()
                .consentId(c.getConsentId())
                .customerId(c.getCustomerId())
                .channel(c.getChannel().name())
                .status(c.getStatus().name())
                .build();
    }
}
