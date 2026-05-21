package com.collectx.payment.entity;

import com.collectx.payment.enums.PTPStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
public class PTP {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ptpId;

    private Long loanAccountId;
    private Long agentId;
    private Long customerId;

    private Double promisedAmount;
    private LocalDate promisedDate;   // "yyyy-MM-DD"
    private String channel;           // CALL / SMS / EMAIL / VISIT
    private String promisedBy;

    /** Free-text notes captured when logging the PTP */
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(20)")
    private PTPStatus status;         // OPEN → KEPT | BROKEN (state machine)

    // ── Audit Trail ───────────────────────────────────────────────────────────
    private String      createdBy;
    private LocalDateTime createdDate;
    private String      modifiedBy;
    private LocalDateTime modifiedDate;
    /** Snapshot of status before last transition */
    private String previousStatus;
    /** Status value after last transition */
    private String newStatus;
}
