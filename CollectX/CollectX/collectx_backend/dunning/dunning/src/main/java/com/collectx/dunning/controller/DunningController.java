package com.collectx.dunning.controller;

import com.collectx.dunning.dto.AttemptRequestDTO;
import com.collectx.dunning.dto.AttemptResponseDTO;
import com.collectx.dunning.service.DunningService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dunning")
@RequiredArgsConstructor
public class DunningController {

    private final DunningService service;

    // ── LOG CONTACT ATTEMPT ───────────────────────────────────────────────────
    // Runs all 4 policy checks: DoNotCall · Consent · MaxAttempts/day · MinGap
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT', 'SUPERVISOR')")
    @PostMapping("/attempt")
    public AttemptResponseDTO attempt(@RequestBody AttemptRequestDTO req) {
        return service.makeAttempt(req);
    }

    // ── GET ALL ATTEMPTS ──────────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'AGENT', 'COMPLIANCE')")
    @GetMapping("/attempts")
    public List<AttemptResponseDTO> getAll() {
        return service.getAllAttempts();
    }

    // ── GET ATTEMPTS FOR ONE LOAN ─────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT', 'SUPERVISOR', 'COMPLIANCE')")
    @GetMapping("/attempts/loan/{loanId}")
    public List<AttemptResponseDTO> getByLoan(@PathVariable Long loanId) {
        return service.getAttemptsByLoan(loanId);
    }
}
