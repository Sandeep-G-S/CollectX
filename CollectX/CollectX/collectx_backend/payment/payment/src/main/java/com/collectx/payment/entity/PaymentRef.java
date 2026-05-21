package com.collectx.payment.entity;

import com.collectx.payment.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
public class PaymentRef {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    private Long loanAccountId;
    private Long agentId;
    private Long customerId;

    private Double amount;
    private LocalDate paymentDate;
    private String paymentMode;      // CASH / CHEQUE / UPI / NEFT / RTGS
    private String referenceNumber;

    /**
     * State machine:  RECORDED → POSTED → CLOSED
     *                 RECORDED → FAILED
     * columnDefinition = "varchar(20)" forces Hibernate to use VARCHAR instead of
     * MySQL ENUM, so new enum values never require a schema migration.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(20)")
    private PaymentStatus status;

    // ── Audit Trail ───────────────────────────────────────────────────────────
    private String        createdBy;
    private LocalDateTime createdDate;
    private String        modifiedBy;
    private LocalDateTime modifiedDate;
    /** Snapshot of status before last transition */
    private String previousStatus;
    /** Status value after last transition */
    private String newStatus;
}
