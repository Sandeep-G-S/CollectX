package com.collectx.legal.service;

import com.collectx.legal.dto.*;
import com.collectx.legal.entity.LegalAction;
import com.collectx.legal.entity.Recovery;
import com.collectx.legal.entity.WriteOff;
import com.collectx.legal.enums.*;
import com.collectx.legal.feign.PortfolioClient;
import com.collectx.legal.repository.LegalRepository;
import com.collectx.legal.repository.RecoveryRepository;
import com.collectx.legal.repository.WriteOffRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LegalService {

    private static final Logger log = LoggerFactory.getLogger(LegalService.class);

    private final LegalRepository    legalRepo;
    private final WriteOffRepository writeOffRepo;
    private final RecoveryRepository recoveryRepo;

    @Autowired(required = false)
    private PortfolioClient portfolioClient;

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /** Resolves the authenticated user's name for audit trail. */
    private String resolveActor() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            return (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";
        } catch (Exception e) {
            return "system";
        }
    }

    private void validateLoanExists(Long loanAccountId) {
        if (portfolioClient != null) {
            try {
                if (!portfolioClient.loanExists(loanAccountId)) {
                    throw new RuntimeException("Loan account ID " + loanAccountId + " does not exist in portfolio");
                }
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Could not validate loan={} — portfolio service unreachable: {}", loanAccountId, e.getMessage());
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEGAL ACTION — create
    // ═══════════════════════════════════════════════════════════════════════

    public LegalActionResponseDTO createLegal(LegalActionRequestDTO dto) {
        log.info("Filing legal action type={} for loan={}", dto.getActionType(), dto.getLoanAccountId());
        validateLoanExists(dto.getLoanAccountId());

        String actor = resolveActor();
        LocalDateTime now = LocalDateTime.now();

        LegalAction action = new LegalAction();
        action.setLoanAccountId(dto.getLoanAccountId());
        action.setCustomerId(dto.getCustomerId());
        action.setActionType(dto.getActionType());
        action.setCaseNumber(dto.getCaseNumber());
        action.setCourtName(dto.getCourtName());
        action.setFiledDate(parseDate(dto.getFiledDate()));
        action.setNextHearingDate(parseDate(dto.getNextHearingDate()));
        action.setAssignedLawyer(dto.getAssignedLawyer());
        action.setNotes(dto.getNotes());
        action.setStatus(LegalStatus.OPEN);
        action.setCreatedBy(actor);
        action.setCreatedDate(now);
        action.setModifiedBy(actor);
        action.setModifiedDate(now);

        LegalAction saved = legalRepo.save(action);
        log.info("Legal action filed with id={}", saved.getLegalId());
        return toLegalResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEGAL ACTION — status transitions
    //   OPEN → IN_PROGRESS → DISPOSED | WITHDRAWN | SETTLEMENT
    // ═══════════════════════════════════════════════════════════════════════

    public LegalActionResponseDTO updateLegalActionStatus(Long id, String newStatusStr) {
        LegalAction action = legalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Legal action not found: " + id));

        LegalStatus newStatus;
        try {
            newStatus = LegalStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid legal status: " + newStatusStr);
        }

        LegalStatus current = action.getStatus();

        // Validate allowed transitions
        Set<LegalStatus> terminal = Set.of(LegalStatus.DISPOSED, LegalStatus.WITHDRAWN, LegalStatus.SETTLEMENT);
        if (terminal.contains(current)) {
            throw new RuntimeException("Legal action " + id + " is already in terminal status: " + current);
        }
        if (current == LegalStatus.OPEN && newStatus != LegalStatus.IN_PROGRESS) {
            throw new RuntimeException("OPEN → " + newStatus + " is not a valid transition. Only IN_PROGRESS is allowed.");
        }
        if (current == LegalStatus.IN_PROGRESS && !terminal.contains(newStatus)) {
            throw new RuntimeException("IN_PROGRESS can only transition to DISPOSED, WITHDRAWN, or SETTLEMENT.");
        }

        String actor = resolveActor();
        action.setPreviousStatus(current.name());
        action.setStatus(newStatus);
        action.setModifiedBy(actor);
        action.setModifiedDate(LocalDateTime.now());

        LegalAction saved = legalRepo.save(action);
        log.info("Legal action {} status changed {} → {} by {}", id, current, newStatus, actor);
        return toLegalResponse(saved);
    }

    /** Convenience shortcut: directly close (DISPOSED) a legal action. */
    public LegalActionResponseDTO closeLegalAction(Long id) {
        LegalAction action = legalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Legal action not found: " + id));

        LegalStatus current = action.getStatus();
        if (current == LegalStatus.DISPOSED) {
            throw new RuntimeException("Legal action " + id + " is already DISPOSED.");
        }

        String actor = resolveActor();
        action.setPreviousStatus(current.name());
        action.setStatus(LegalStatus.DISPOSED);
        action.setModifiedBy(actor);
        action.setModifiedDate(LocalDateTime.now());

        LegalAction saved = legalRepo.save(action);
        log.info("Legal action {} closed (DISPOSED) by {}", id, actor);
        return toLegalResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEGAL ACTION — queries
    // ═══════════════════════════════════════════════════════════════════════

    public List<LegalActionResponseDTO> getAllActions() {
        return legalRepo.findAll().stream().map(this::toLegalResponse).collect(Collectors.toList());
    }

    public List<LegalActionResponseDTO> getLegalActionsByLoan(Long loanId) {
        return legalRepo.findByLoanAccountId(loanId).stream().map(this::toLegalResponse).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WRITE-OFF — create (status = PENDING)
    //   PENDING → POSTED → REVERSED
    // ═══════════════════════════════════════════════════════════════════════

    public WriteOffResponseDTO writeOff(WriteOffRequestDTO dto) {
        log.info("Initiating write-off for loan={} customer={}", dto.getLoanAccountId(), dto.getCustomerId());
        validateLoanExists(dto.getLoanAccountId());

        String actor = resolveActor();
        LocalDateTime now = LocalDateTime.now();

        WriteOff w = new WriteOff();
        w.setLoanAccountId(dto.getLoanAccountId());
        w.setCustomerId(dto.getCustomerId());
        w.setPrincipalWO(dto.getPrincipalWO());
        w.setInterestWO(dto.getInterestWO());
        w.setFeesWO(dto.getFeesWO());

        // Compute total; prefer explicit total if supplied
        double total = dto.getWriteOffAmount() != null ? dto.getWriteOffAmount()
                : sum(dto.getPrincipalWO(), dto.getInterestWO(), dto.getFeesWO());
        w.setWriteOffAmount(total);

        if (dto.getWriteOffReason() != null) {
            try { w.setWriteOffReason(WriteOffReason.valueOf(dto.getWriteOffReason().toUpperCase())); }
            catch (IllegalArgumentException e) { log.warn("Unknown writeOffReason: {}", dto.getWriteOffReason()); }
        }

        w.setReason(dto.getReason());
        w.setApprovedBy(dto.getApprovedBy());
        w.setChargeOffDate(parseDate(dto.getChargeOffDate()));
        w.setApprovalDate(parseDate(dto.getApprovalDate()));
        w.setNotes(dto.getNotes());
        w.setStatus(WriteOffStatus.PENDING);
        w.setCreatedBy(actor);
        w.setCreatedDate(now);
        w.setModifiedBy(actor);
        w.setModifiedDate(now);

        WriteOff saved = writeOffRepo.save(w);
        log.info("Write-off initiated with id={} status=PENDING", saved.getWriteOffId());
        return toWriteOffResponse(saved);
    }

    /** Post (approve) a PENDING write-off → POSTED. */
    public WriteOffResponseDTO postWriteOff(Long id) {
        WriteOff w = writeOffRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Write-off not found: " + id));
        if (w.getStatus() != WriteOffStatus.PENDING) {
            throw new RuntimeException("Write-off " + id + " is not in PENDING status; current: " + w.getStatus());
        }
        String actor = resolveActor();
        w.setPreviousStatus(w.getStatus().name());
        w.setStatus(WriteOffStatus.POSTED);
        w.setModifiedBy(actor);
        w.setModifiedDate(LocalDateTime.now());
        WriteOff saved = writeOffRepo.save(w);
        log.info("Write-off {} posted by {}", id, actor);
        return toWriteOffResponse(saved);
    }

    /** Reverse a POSTED write-off → REVERSED. */
    public WriteOffResponseDTO reverseWriteOff(Long id) {
        WriteOff w = writeOffRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Write-off not found: " + id));
        if (w.getStatus() != WriteOffStatus.POSTED) {
            throw new RuntimeException("Write-off " + id + " must be POSTED to reverse; current: " + w.getStatus());
        }
        String actor = resolveActor();
        w.setPreviousStatus(w.getStatus().name());
        w.setStatus(WriteOffStatus.REVERSED);
        w.setModifiedBy(actor);
        w.setModifiedDate(LocalDateTime.now());
        WriteOff saved = writeOffRepo.save(w);
        log.info("Write-off {} reversed by {}", id, actor);
        return toWriteOffResponse(saved);
    }

    // ── Write-Off queries ─────────────────────────────────────────────────

    public List<WriteOffResponseDTO> getAllWriteOffs() {
        return writeOffRepo.findAll().stream().map(this::toWriteOffResponse).collect(Collectors.toList());
    }

    public List<WriteOffResponseDTO> getWriteOffsByLoan(Long loanId) {
        return writeOffRepo.findByLoanAccountId(loanId).stream().map(this::toWriteOffResponse).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RECOVERY — create (status = RECORDED)
    //   RECORDED → VERIFIED → CLOSED
    // ═══════════════════════════════════════════════════════════════════════

    public RecoveryResponseDTO recover(RecoveryRequestDTO dto) {
        log.info("Recording recovery amount={} for loan={}", dto.getRecoveredAmount(), dto.getLoanAccountId());
        validateLoanExists(dto.getLoanAccountId());

        String actor = resolveActor();
        LocalDateTime now = LocalDateTime.now();

        Recovery r = new Recovery();
        r.setLoanAccountId(dto.getLoanAccountId());
        r.setCustomerId(dto.getCustomerId());
        r.setRecoveredAmount(dto.getRecoveredAmount());
        r.setRecoveryType(dto.getRecoveryType());
        r.setRecoveryDate(parseDate(dto.getRecoveryDate()));
        r.setNotes(dto.getNotes());
        r.setLinkedWriteOffId(dto.getLinkedWriteOffId());

        if (dto.getSource() != null) {
            try { r.setSource(RecoverySource.valueOf(dto.getSource().toUpperCase())); }
            catch (IllegalArgumentException e) { log.warn("Unknown recovery source: {}", dto.getSource()); }
        }
        if (dto.getRecoveryMode() != null) {
            try { r.setRecoveryMode(RecoveryMode.valueOf(dto.getRecoveryMode().toUpperCase())); }
            catch (IllegalArgumentException e) { log.warn("Unknown recovery mode: {}", dto.getRecoveryMode()); }
        }

        r.setStatus(RecoveryStatus.RECORDED);
        r.setCreatedBy(actor);
        r.setCreatedDate(now);
        r.setModifiedBy(actor);
        r.setModifiedDate(now);

        Recovery saved = recoveryRepo.save(r);
        log.info("Recovery recorded with id={} status=RECORDED", saved.getRecoveryId());
        return toRecoveryResponse(saved);
    }

    /** Verify a RECORDED recovery → VERIFIED. */
    public RecoveryResponseDTO verifyRecovery(Long id) {
        Recovery r = recoveryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Recovery not found: " + id));
        if (r.getStatus() != RecoveryStatus.RECORDED) {
            throw new RuntimeException("Recovery " + id + " must be RECORDED to verify; current: " + r.getStatus());
        }
        String actor = resolveActor();
        r.setPreviousStatus(r.getStatus().name());
        r.setStatus(RecoveryStatus.VERIFIED);
        r.setModifiedBy(actor);
        r.setModifiedDate(LocalDateTime.now());
        Recovery saved = recoveryRepo.save(r);
        log.info("Recovery {} verified by {}", id, actor);
        return toRecoveryResponse(saved);
    }

    /** Close a VERIFIED recovery → CLOSED. */
    public RecoveryResponseDTO closeRecovery(Long id) {
        Recovery r = recoveryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Recovery not found: " + id));
        if (r.getStatus() != RecoveryStatus.VERIFIED) {
            throw new RuntimeException("Recovery " + id + " must be VERIFIED to close; current: " + r.getStatus());
        }
        String actor = resolveActor();
        r.setPreviousStatus(r.getStatus().name());
        r.setStatus(RecoveryStatus.CLOSED);
        r.setModifiedBy(actor);
        r.setModifiedDate(LocalDateTime.now());
        Recovery saved = recoveryRepo.save(r);
        log.info("Recovery {} closed by {}", id, actor);
        return toRecoveryResponse(saved);
    }

    // ── Recovery queries ──────────────────────────────────────────────────

    public List<RecoveryResponseDTO> getAllRecoveries() {
        return recoveryRepo.findAll().stream().map(this::toRecoveryResponse).collect(Collectors.toList());
    }

    public List<RecoveryResponseDTO> getRecoveriesByLoan(Long loanId) {
        return recoveryRepo.findByLoanAccountId(loanId).stream().map(this::toRecoveryResponse).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAPPERS
    // ═══════════════════════════════════════════════════════════════════════

    private LegalActionResponseDTO toLegalResponse(LegalAction a) {
        return LegalActionResponseDTO.builder()
                .legalActionId(a.getLegalId())
                .loanAccountId(a.getLoanAccountId())
                .customerId(a.getCustomerId())
                .actionType(a.getActionType())
                .caseNumber(a.getCaseNumber())
                .courtName(a.getCourtName())
                .filedDate(str(a.getFiledDate()))
                .nextHearingDate(str(a.getNextHearingDate()))
                .assignedLawyer(a.getAssignedLawyer())
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .notes(a.getNotes())
                .createdBy(a.getCreatedBy())
                .createdDate(a.getCreatedDate() != null ? a.getCreatedDate().toString() : null)
                .modifiedBy(a.getModifiedBy())
                .modifiedDate(a.getModifiedDate() != null ? a.getModifiedDate().toString() : null)
                .previousStatus(a.getPreviousStatus())
                .build();
    }

    private WriteOffResponseDTO toWriteOffResponse(WriteOff w) {
        return WriteOffResponseDTO.builder()
                .writeOffId(w.getWriteOffId())
                .loanAccountId(w.getLoanAccountId())
                .customerId(w.getCustomerId())
                .principalWO(w.getPrincipalWO())
                .interestWO(w.getInterestWO())
                .feesWO(w.getFeesWO())
                .writeOffAmount(w.getWriteOffAmount())
                .writeOffReason(w.getWriteOffReason() != null ? w.getWriteOffReason().name() : null)
                .reason(w.getReason())
                .approvedBy(w.getApprovedBy())
                .chargeOffDate(str(w.getChargeOffDate()))
                .approvalDate(str(w.getApprovalDate()))
                .notes(w.getNotes())
                .status(w.getStatus() != null ? w.getStatus().name() : null)
                .createdBy(w.getCreatedBy())
                .createdDate(w.getCreatedDate() != null ? w.getCreatedDate().toString() : null)
                .modifiedBy(w.getModifiedBy())
                .modifiedDate(w.getModifiedDate() != null ? w.getModifiedDate().toString() : null)
                .previousStatus(w.getPreviousStatus())
                .build();
    }

    private RecoveryResponseDTO toRecoveryResponse(Recovery r) {
        return RecoveryResponseDTO.builder()
                .recoveryId(r.getRecoveryId())
                .loanAccountId(r.getLoanAccountId())
                .customerId(r.getCustomerId())
                .recoveredAmount(r.getRecoveredAmount())
                .recoveryType(r.getRecoveryType())
                .recoveryDate(str(r.getRecoveryDate()))
                .source(r.getSource() != null ? r.getSource().name() : null)
                .recoveryMode(r.getRecoveryMode() != null ? r.getRecoveryMode().name() : null)
                .status(r.getStatus() != null ? r.getStatus().name() : null)
                .linkedWriteOffId(r.getLinkedWriteOffId())
                .notes(r.getNotes())
                .createdBy(r.getCreatedBy())
                .createdDate(r.getCreatedDate() != null ? r.getCreatedDate().toString() : null)
                .modifiedBy(r.getModifiedBy())
                .modifiedDate(r.getModifiedDate() != null ? r.getModifiedDate().toString() : null)
                .previousStatus(r.getPreviousStatus())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    private static LocalDate parseDate(String s) {
        return (s != null && !s.isBlank()) ? LocalDate.parse(s) : null;
    }

    private static String str(LocalDate d) {
        return d != null ? d.toString() : null;
    }

    private static double sum(Double... vals) {
        double total = 0;
        for (Double v : vals) if (v != null) total += v;
        return total;
    }
}
