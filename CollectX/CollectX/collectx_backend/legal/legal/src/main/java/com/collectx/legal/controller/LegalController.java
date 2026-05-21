package com.collectx.legal.controller;

import com.collectx.legal.dto.*;
import com.collectx.legal.service.LegalService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/legal")
@RequiredArgsConstructor
public class LegalController {

    private final LegalService service;

    // ═══════════════════════════════════════════════════════════════════════
    // LEGAL ACTION — create
    // ═══════════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('COMPLIANCE', 'ADMIN')")
    @PostMapping("/action")
    public LegalActionResponseDTO createLegalAction(@RequestBody LegalActionRequestDTO dto) {
        return service.createLegal(dto);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEGAL ACTION — status transitions
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Update legal action status.
     * Body: { "status": "IN_PROGRESS" | "DISPOSED" | "WITHDRAWN" | "SETTLEMENT" }
     */
    @PreAuthorize("hasAnyRole('COMPLIANCE', 'ADMIN')")
    @PutMapping("/action/{id}/status")
    public LegalActionResponseDTO updateActionStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            throw new RuntimeException("Request body must contain 'status' field");
        }
        return service.updateLegalActionStatus(id, newStatus);
    }

    /** Close (DISPOSE) a legal action directly. */
    @PreAuthorize("hasAnyRole('COMPLIANCE', 'ADMIN')")
    @PutMapping("/action/{id}/close")
    public LegalActionResponseDTO closeLegalAction(@PathVariable Long id) {
        return service.closeLegalAction(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEGAL ACTION — queries
    // ═══════════════════════════════════════════════════════════════════════

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/actions")
    public List<LegalActionResponseDTO> getAllActions() {
        return service.getAllActions();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/actions/loan/{loanId}")
    public List<LegalActionResponseDTO> getActionsByLoan(@PathVariable Long loanId) {
        return service.getLegalActionsByLoan(loanId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WRITE-OFF — create (PENDING) / post / reverse
    // ═══════════════════════════════════════════════════════════════════════

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/writeoff")
    public WriteOffResponseDTO initiateWriteOff(@RequestBody WriteOffRequestDTO dto) {
        return service.writeOff(dto);
    }

    /** Post (approve) a PENDING write-off → POSTED. */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/writeoff/{id}/post")
    public WriteOffResponseDTO postWriteOff(@PathVariable Long id) {
        return service.postWriteOff(id);
    }

    /** Reverse a POSTED write-off → REVERSED. */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/writeoff/{id}/reverse")
    public WriteOffResponseDTO reverseWriteOff(@PathVariable Long id) {
        return service.reverseWriteOff(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WRITE-OFF — queries
    // ═══════════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE')")
    @GetMapping("/writeoffs")
    public List<WriteOffResponseDTO> getAllWriteOffs() {
        return service.getAllWriteOffs();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE')")
    @GetMapping("/writeoffs/loan/{loanId}")
    public List<WriteOffResponseDTO> getWriteOffsByLoan(@PathVariable Long loanId) {
        return service.getWriteOffsByLoan(loanId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RECOVERY — create (RECORDED) / verify / close
    // ═══════════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('RECOVERY', 'ADMIN')")
    @PostMapping("/recovery")
    public RecoveryResponseDTO recordRecovery(@RequestBody RecoveryRequestDTO dto) {
        return service.recover(dto);
    }

    /** Verify a RECORDED recovery → VERIFIED. Admin/Supervisor only. */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/recovery/{id}/verify")
    public RecoveryResponseDTO verifyRecovery(@PathVariable Long id) {
        return service.verifyRecovery(id);
    }

    /** Close a VERIFIED recovery → CLOSED. Admin/Supervisor only. */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/recovery/{id}/close")
    public RecoveryResponseDTO closeRecovery(@PathVariable Long id) {
        return service.closeRecovery(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RECOVERY — queries
    // ═══════════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('ADMIN', 'RECOVERY', 'COMPLIANCE')")
    @GetMapping("/recoveries")
    public List<RecoveryResponseDTO> getAllRecoveries() {
        return service.getAllRecoveries();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'RECOVERY', 'COMPLIANCE')")
    @GetMapping("/recoveries/loan/{loanId}")
    public List<RecoveryResponseDTO> getRecoveriesByLoan(@PathVariable Long loanId) {
        return service.getRecoveriesByLoan(loanId);
    }
}
