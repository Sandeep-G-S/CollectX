package com.collectx.payment.service;

import com.collectx.payment.dto.*;
import com.collectx.payment.entity.PTP;
import com.collectx.payment.entity.PaymentRef;
import com.collectx.payment.entity.Settlement;
import com.collectx.payment.enums.ApprovalStatus;
import com.collectx.payment.enums.PTPStatus;
import com.collectx.payment.enums.PaymentStatus;
import com.collectx.payment.enums.SettlementStatus;
import com.collectx.payment.feign.NotificationClient;
import com.collectx.payment.feign.PortfolioClient;
import com.collectx.payment.feign.ReportingClient;
import com.collectx.payment.repository.PTPRepository;
import com.collectx.payment.repository.PaymentRepository;
import com.collectx.payment.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PTPRepository       ptpRepo;
    private final PaymentRepository   paymentRepo;
    private final SettlementRepository settlementRepo;

    // required=false → service starts even if a downstream service is unavailable
    @Autowired(required = false) private NotificationClient notificationClient;
    @Autowired(required = false) private ReportingClient    reportingClient;
    @Autowired(required = false) private PortfolioClient    portfolioClient;

    // ═══════════════════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════════════════

    private void validateLoanExists(Long loanAccountId) {
        if (portfolioClient == null) {
            log.warn("PortfolioClient not available — skipping loan validation for loanId={}", loanAccountId);
            return;
        }
        try {
            boolean exists = portfolioClient.loanExists(loanAccountId);
            if (!exists) {
                // Loan genuinely does not exist in the portfolio DB
                throw new RuntimeException("Loan account ID " + loanAccountId + " does not exist in portfolio");
            }
        } catch (RuntimeException e) {
            // Only re-throw our own domain validation error, not infrastructure/Feign errors
            if (e.getMessage() != null && e.getMessage().contains("does not exist in portfolio")) {
                throw e;
            }
            // FeignException, RetryableException, circuit-breaker errors → fail open
            log.warn("Could not validate loan={} — portfolio service unreachable ({}), allowing request through",
                    loanAccountId, e.getClass().getSimpleName());
        } catch (Exception e) {
            log.warn("Could not validate loan={} — unexpected error: {}", loanAccountId, e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PTP — logPTP  (status always forced to OPEN)
    // ═══════════════════════════════════════════════════════════════════════

    public PTPResponseDTO createPTP(PTPRequestDTO dto) {
        log.info("Logging PTP loan={} customer={} amount={} channel={}",
                dto.getLoanAccountId(), dto.getCustomerId(), dto.getPromisedAmount(), dto.getChannel());
        validateLoanExists(dto.getLoanAccountId());

        PTP ptp = new PTP();
        ptp.setLoanAccountId(dto.getLoanAccountId());
        ptp.setAgentId(dto.getAgentId());
        ptp.setCustomerId(dto.getCustomerId());
        ptp.setPromisedAmount(dto.getPromisedAmount());
        ptp.setPromisedDate(dto.getPromisedDate() != null ? LocalDate.parse(dto.getPromisedDate()) : null);
        ptp.setChannel(dto.getChannel());
        ptp.setPromisedBy(dto.getPromisedBy());
        ptp.setNotes(dto.getNotes());

        // ── Status is ALWAYS forced to OPEN — client cannot override ──────────
        ptp.setStatus(PTPStatus.OPEN);

        // Audit
        ptp.setCreatedBy(resolveActor());
        ptp.setCreatedDate(LocalDateTime.now());
        ptp.setNewStatus(PTPStatus.OPEN.name());

        PTP saved = ptpRepo.save(ptp);
        log.info("PTP logged id={} loan={} promisedDate={}", saved.getPtpId(), saved.getLoanAccountId(), saved.getPromisedDate());
        return toPTPResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PTP — autoUpdatePTPStatus  (OPEN → KEPT | BROKEN)
    //   Runs daily at 01:00; also exposed as a manual endpoint.
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Checks all OPEN PTPs whose promise date has passed.
     * For each:
     *   — if a POSTED payment ≥ promisedAmount was recorded on or before promisedDate → KEPT
     *   — otherwise → BROKEN
     * Returns count of updated records.
     */
    @Scheduled(cron = "0 0 1 * * *")   // every day at 01:00
    @Transactional
    public int autoUpdatePTPStatus() {
        LocalDate today = LocalDate.now();
        List<PTP> overdue = ptpRepo.findByStatusAndPromisedDateBefore(PTPStatus.OPEN, today);
        log.info("PTP auto-update: {} overdue OPEN PTPs found for date {}", overdue.size(), today);

        int updated = 0;
        for (PTP ptp : overdue) {
            // Collect all POSTED (verified) payments for this loan
            List<PaymentRef> postedPayments = paymentRepo
                    .findByLoanAccountIdAndStatus(ptp.getLoanAccountId(), PaymentStatus.POSTED);

            // A payment "covers" this PTP if it was received on or before the promise date
            // and the amount is at least the promised amount
            boolean paid = postedPayments.stream().anyMatch(p ->
                    p.getPaymentDate() != null
                    && !p.getPaymentDate().isAfter(ptp.getPromisedDate())
                    && p.getAmount() != null
                    && p.getAmount() >= ptp.getPromisedAmount()
            );

            PTPStatus newStatus = paid ? PTPStatus.KEPT : PTPStatus.BROKEN;
            String prevStatus   = ptp.getStatus().name();

            ptp.setPreviousStatus(prevStatus);
            ptp.setStatus(newStatus);
            ptp.setNewStatus(newStatus.name());
            ptp.setModifiedBy("SYSTEM");
            ptp.setModifiedDate(LocalDateTime.now());
            ptpRepo.save(ptp);

            log.info("PTP id={} loan={}: {} → {}", ptp.getPtpId(), ptp.getLoanAccountId(), prevStatus, newStatus);

            // Send notification for BROKEN PTPs (Admin review / possible escalation)
            if (newStatus == PTPStatus.BROKEN && ptp.getCustomerId() != null) {
                sendNotification(ptp.getCustomerId(), ptp.getLoanAccountId(),
                        "PTP BROKEN — Loan " + ptp.getLoanAccountId() +
                        " promise of ₹" + ptp.getPromisedAmount() +
                        " by " + ptp.getPromisedDate() + " was not kept.");
            }
            updated++;
        }
        log.info("PTP auto-update complete: {} records updated", updated);
        return updated;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYMENT — recordPayment  (status = RECORDED)
    // ═══════════════════════════════════════════════════════════════════════

    public PaymentResponseDTO makePayment(PaymentRequestDTO dto, String token) {
        log.info("Recording payment amount={} mode={} loan={}", dto.getAmount(), dto.getPaymentMode(), dto.getLoanAccountId());
        validateLoanExists(dto.getLoanAccountId());

        PaymentRef payment = new PaymentRef();
        payment.setLoanAccountId(dto.getLoanAccountId());
        payment.setAgentId(dto.getAgentId());
        payment.setCustomerId(dto.getCustomerId());
        payment.setAmount(dto.getAmount());
        payment.setPaymentMode(dto.getPaymentMode());
        payment.setReferenceNumber(dto.getReferenceNumber());
        // Use the date provided by the caller; fall back to today if absent
        payment.setPaymentDate(dto.getPaymentDate() != null && !dto.getPaymentDate().isBlank()
                ? LocalDate.parse(dto.getPaymentDate())
                : LocalDate.now());

        // ── Always starts as RECORDED; moves to POSTED only after admin verifies ─
        payment.setStatus(PaymentStatus.RECORDED);

        // Audit
        payment.setCreatedBy(resolveActor());
        payment.setCreatedDate(LocalDateTime.now());
        payment.setNewStatus(PaymentStatus.RECORDED.name());

        PaymentRef saved = paymentRepo.save(payment);
        log.info("Payment recorded id={} status=RECORDED (pending admin verification)", saved.getPaymentId());
        return toPaymentResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYMENT — verifyPayment  (RECORDED → POSTED)
    //   Admin action: confirms the payment is genuine.
    //   Side effects: portfolio balance update + PTP marking.
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public PaymentResponseDTO verifyPayment(Long paymentId) {
        log.info("Admin verifying paymentId={}", paymentId);

        PaymentRef payment = paymentRepo.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (payment.getStatus() != PaymentStatus.RECORDED) {
            throw new RuntimeException("Only RECORDED payments can be verified. Current status: " + payment.getStatus());
        }

        String prevStatus = payment.getStatus().name();
        payment.setPreviousStatus(prevStatus);
        payment.setStatus(PaymentStatus.POSTED);
        payment.setNewStatus(PaymentStatus.POSTED.name());
        payment.setModifiedBy(resolveActor());
        payment.setModifiedDate(LocalDateTime.now());
        PaymentRef saved = paymentRepo.save(payment);

        // ── Apply payment to portfolio (update principal/interest OS) ─────────
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("loanAccountId", payment.getLoanAccountId());
            body.put("amount", payment.getAmount());
            portfolioClient.applyPayment(body);
        } catch (Exception e) {
            log.warn("Portfolio update failed for paymentId={}: {}", paymentId, e.getMessage());
        }

        // ── Update any matching OPEN PTP for this loan ────────────────────────
        List<PTP> ptps = ptpRepo.findByLoanAccountId(payment.getLoanAccountId());
        for (PTP ptp : ptps) {
            if (ptp.getStatus() == PTPStatus.OPEN) {
                PTPStatus newPtpStatus;
                if (payment.getAmount() != null && ptp.getPromisedAmount() != null
                        && payment.getAmount() >= ptp.getPromisedAmount()) {
                    newPtpStatus = PTPStatus.KEPT;
                } else {
                    newPtpStatus = PTPStatus.BROKEN;
                }
                String prevPtp = ptp.getStatus().name();
                ptp.setPreviousStatus(prevPtp);
                ptp.setStatus(newPtpStatus);
                ptp.setNewStatus(newPtpStatus.name());
                ptp.setModifiedBy("SYSTEM");
                ptp.setModifiedDate(LocalDateTime.now());
                ptpRepo.save(ptp);
                log.info("PTP id={} updated: {} → {}", ptp.getPtpId(), prevPtp, newPtpStatus);

                sendNotification(payment.getCustomerId(), payment.getLoanAccountId(),
                        newPtpStatus == PTPStatus.KEPT
                                ? "PTP KEPT for Loan " + payment.getLoanAccountId()
                                : "PTP BROKEN for Loan " + payment.getLoanAccountId());
            }
        }

        // ── Report performance ────────────────────────────────────────────────
        if (reportingClient != null) {
            try {
                Map<String, Object> reportBody = new HashMap<>();
                reportBody.put("agentId", payment.getAgentId() != null ? payment.getAgentId() : 1);
                reportBody.put("period", "MONTHLY");
                reportBody.put("accountsWorked", 1);
                reportBody.put("contactsMade", 1);
                reportBody.put("ptpsBooked", 1);
                reportBody.put("ptpKept", 1);
                reportBody.put("amountCollected", payment.getAmount());
                reportingClient.sendPerformance(reportBody);
            } catch (Exception e) {
                log.warn("Reporting failed for paymentId={}: {}", paymentId, e.getMessage());
            }
        }

        log.info("Payment id={} verified: RECORDED → POSTED", paymentId);
        return toPaymentResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYMENT — closePayment  (POSTED → CLOSED)
    //   Admin action: marks the payment lifecycle as complete.
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public PaymentResponseDTO closePayment(Long paymentId) {
        log.info("Admin closing paymentId={}", paymentId);

        PaymentRef payment = paymentRepo.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (payment.getStatus() != PaymentStatus.POSTED) {
            throw new RuntimeException("Only POSTED payments can be closed. Current status: " + payment.getStatus());
        }

        String prevStatus = payment.getStatus().name();
        payment.setPreviousStatus(prevStatus);
        payment.setStatus(PaymentStatus.CLOSED);
        payment.setNewStatus(PaymentStatus.CLOSED.name());
        payment.setModifiedBy(resolveActor());
        payment.setModifiedDate(LocalDateTime.now());
        PaymentRef saved = paymentRepo.save(payment);

        log.info("Payment id={} closed: POSTED → CLOSED", paymentId);
        return toPaymentResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYMENT — failPayment  (RECORDED → FAILED)
    //   Admin action: bounced cheque, UTR mismatch, etc.
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public PaymentResponseDTO failPayment(Long paymentId) {
        log.info("Admin marking paymentId={} as FAILED", paymentId);

        PaymentRef payment = paymentRepo.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (payment.getStatus() != PaymentStatus.RECORDED) {
            throw new RuntimeException("Only RECORDED payments can be marked FAILED. Current status: " + payment.getStatus());
        }

        String prevStatus = payment.getStatus().name();
        payment.setPreviousStatus(prevStatus);
        payment.setStatus(PaymentStatus.FAILED);
        payment.setNewStatus(PaymentStatus.FAILED.name());
        payment.setModifiedBy(resolveActor());
        payment.setModifiedDate(LocalDateTime.now());
        PaymentRef saved = paymentRepo.save(payment);

        log.info("Payment id={} marked FAILED: RECORDED → FAILED", paymentId);
        return toPaymentResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTLEMENT
    // ═══════════════════════════════════════════════════════════════════════

    public SettlementResponseDTO requestSettlement(SettlementRequestDTO dto) {
        log.info("Settlement request amount={} waiver={} loan={} customer={}",
                dto.getSettlementAmount(), dto.getWaiverAmount(), dto.getLoanAccountId(), dto.getCustomerId());
        validateLoanExists(dto.getLoanAccountId());

        Settlement s = new Settlement();
        s.setLoanAccountId(dto.getLoanAccountId());
        s.setAgentId(dto.getAgentId());
        s.setCustomerId(dto.getCustomerId());
        s.setSettlementAmount(dto.getSettlementAmount());
        s.setWaiverAmount(dto.getWaiverAmount());
        s.setReason(dto.getReason());
        s.setApprovalStatus(ApprovalStatus.REQUESTED);
        s.setStatus(SettlementStatus.ACTIVE);

        Settlement saved = settlementRepo.save(s);
        log.info("Settlement created id={}", saved.getSettlementId());
        return toSettlementResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    public List<PTPResponseDTO>     getAllPTPs()        { return ptpRepo.findAll().stream().map(this::toPTPResponse).collect(Collectors.toList()); }
    public List<PaymentResponseDTO> getAllPayments()    { return paymentRepo.findAll().stream().map(this::toPaymentResponse).collect(Collectors.toList()); }
    public List<SettlementResponseDTO> getAllSettlements() { return settlementRepo.findAll().stream().map(this::toSettlementResponse).collect(Collectors.toList()); }
    public List<PTPResponseDTO>     getPTPs(Long loanId) { return ptpRepo.findByLoanAccountId(loanId).stream().map(this::toPTPResponse).collect(Collectors.toList()); }

    /** Returns all BROKEN PTPs — used by Admin for review / legal escalation */
    public List<PTPResponseDTO> getBrokenPTPs() {
        return ptpRepo.findByStatus(PTPStatus.BROKEN).stream().map(this::toPTPResponse).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private void sendNotification(Long customerId, Long loanAccountId, String message) {
        if (notificationClient == null) {
            log.warn("NotificationClient not available — skipping notification for loan={}", loanAccountId);
            return;
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("customerId",       customerId != null ? customerId : 0L);
            body.put("loanAccountId",    loanAccountId);
            body.put("channel",          "INAPP");
            body.put("notificationType", "PTP");
            body.put("message",          message);
            notificationClient.send(body);
        } catch (Exception e) {
            log.warn("Notification failed for loan={}: {}", loanAccountId, e.getMessage());
        }
    }

    /** Resolves the current actor name. Placeholder — wire to SecurityContextHolder in production. */
    private String resolveActor() {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            return (auth != null && auth.getName() != null) ? auth.getName() : "SYSTEM";
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAPPERS
    // ═══════════════════════════════════════════════════════════════════════

    private PTPResponseDTO toPTPResponse(PTP p) {
        return PTPResponseDTO.builder()
                .ptpId(p.getPtpId())
                .loanAccountId(p.getLoanAccountId())
                .agentId(p.getAgentId())
                .customerId(p.getCustomerId())
                .promisedAmount(p.getPromisedAmount())
                .promisedDate(p.getPromisedDate() != null ? p.getPromisedDate().toString() : null)
                .channel(p.getChannel())
                .promisedBy(p.getPromisedBy())
                .notes(p.getNotes())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .createdBy(p.getCreatedBy())
                .createdDate(p.getCreatedDate() != null ? p.getCreatedDate().toString() : null)
                .modifiedBy(p.getModifiedBy())
                .modifiedDate(p.getModifiedDate() != null ? p.getModifiedDate().toString() : null)
                .previousStatus(p.getPreviousStatus())
                .newStatus(p.getNewStatus())
                .build();
    }

    private PaymentResponseDTO toPaymentResponse(PaymentRef p) {
        return PaymentResponseDTO.builder()
                .paymentId(p.getPaymentId())
                .loanAccountId(p.getLoanAccountId())
                .agentId(p.getAgentId())
                .customerId(p.getCustomerId())
                .amount(p.getAmount())
                .paymentDate(p.getPaymentDate() != null ? p.getPaymentDate().toString() : null)
                .paymentMode(p.getPaymentMode())
                .referenceNumber(p.getReferenceNumber())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .createdBy(p.getCreatedBy())
                .createdDate(p.getCreatedDate() != null ? p.getCreatedDate().toString() : null)
                .modifiedBy(p.getModifiedBy())
                .modifiedDate(p.getModifiedDate() != null ? p.getModifiedDate().toString() : null)
                .previousStatus(p.getPreviousStatus())
                .newStatus(p.getNewStatus())
                .build();
    }

    private SettlementResponseDTO toSettlementResponse(Settlement s) {
        return SettlementResponseDTO.builder()
                .settlementId(s.getSettlementId())
                .loanAccountId(s.getLoanAccountId())
                .agentId(s.getAgentId())
                .customerId(s.getCustomerId())
                .settlementAmount(s.getSettlementAmount())
                .waiverAmount(s.getWaiverAmount())
                .reason(s.getReason())
                .approvalStatus(s.getApprovalStatus() != null ? s.getApprovalStatus().name() : null)
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .build();
    }
}
