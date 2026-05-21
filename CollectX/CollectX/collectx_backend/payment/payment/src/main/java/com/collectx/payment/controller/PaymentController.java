package com.collectx.payment.controller;

import com.collectx.payment.dto.*;
import com.collectx.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService service;

    // ═══════════════════════════════════════════════════════════════════════
    // PTP — log (status always forced to OPEN by service layer)
    // ═══════════════════════════════════════════════════════════════════════
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/ptp")
    public PTPResponseDTO createPTP(@RequestBody PTPRequestDTO dto) {
        return service.createPTP(dto);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PTP — get all / by loan / broken (Admin escalation list)
    // ═══════════════════════════════════════════════════════════════════════
    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR', 'COMPLIANCE', 'ADMIN', 'RECOVERY', 'FIELD')")
    @GetMapping("/ptp/all")
    public List<PTPResponseDTO> getAllPTPs() {
        return service.getAllPTPs();
    }

    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR', 'COMPLIANCE', 'ADMIN', 'RECOVERY', 'FIELD')")
    @GetMapping("/ptp/{loanId}")
    public List<PTPResponseDTO> getPTP(@PathVariable Long loanId) {
        return service.getPTPs(loanId);
    }

    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR', 'COMPLIANCE', 'ADMIN', 'RECOVERY', 'FIELD')")
    @GetMapping("/ptp/loan/{loanId}")
    public List<PTPResponseDTO> getPTPByLoan(@PathVariable Long loanId) {
        return service.getPTPs(loanId);
    }

    /**
     * Returns all BROKEN PTPs for Admin review / legal escalation.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'COMPLIANCE')")
    @GetMapping("/ptp/broken")
    public List<PTPResponseDTO> getBrokenPTPs() {
        return service.getBrokenPTPs();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PTP — manual auto-update trigger (nightly cron runs automatically)
    // ═══════════════════════════════════════════════════════════════════════
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/ptp/auto-update")
    public Map<String, Object> triggerPTPAutoUpdate() {
        int updated = service.autoUpdatePTPStatus();
        return Map.of("message", "PTP auto-update complete", "recordsUpdated", updated);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYMENT — record (status = RECORDED)
    // ═══════════════════════════════════════════════════════════════════════
    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR', 'ADMIN', 'RECOVERY', 'FIELD')")
    @PostMapping("/create")
    public PaymentResponseDTO pay(@RequestBody PaymentRequestDTO dto,
                                  @RequestHeader("Authorization") String token) {
        return service.makePayment(dto, token);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYMENT — verify (RECORDED → POSTED) — Admin / Supervisor
    // ═══════════════════════════════════════════════════════════════════════
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/verify/{id}")
    public PaymentResponseDTO verifyPayment(@PathVariable Long id) {
        return service.verifyPayment(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYMENT — close (POSTED → CLOSED) — Admin / Supervisor
    // ═══════════════════════════════════════════════════════════════════════
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/close/{id}")
    public PaymentResponseDTO closePayment(@PathVariable Long id) {
        return service.closePayment(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYMENT — fail (RECORDED → FAILED) — Admin / Supervisor
    // ═══════════════════════════════════════════════════════════════════════
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/fail/{id}")
    public PaymentResponseDTO failPayment(@PathVariable Long id) {
        return service.failPayment(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYMENT — get all
    // ═══════════════════════════════════════════════════════════════════════
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/payments")
    public List<PaymentResponseDTO> getAllPayments() {
        return service.getAllPayments();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTLEMENT — request / get all
    // ═══════════════════════════════════════════════════════════════════════
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    @PostMapping("/settlement")
    public SettlementResponseDTO settlement(@RequestBody SettlementRequestDTO dto) {
        return service.requestSettlement(dto);
    }

    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN', 'COMPLIANCE', 'AGENT', 'FIELD', 'RECOVERY')")
    @GetMapping("/settlements")
    public List<SettlementResponseDTO> getAllSettlements() {
        return service.getAllSettlements();
    }
}
