package com.collectx.legal.entity;

import com.collectx.legal.enums.WriteOffReason;
import com.collectx.legal.enums.WriteOffStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
public class WriteOff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long writeOffId;

    private Long loanAccountId;
    private Long customerId;

    // ── Amount breakdown ─────────────────────────────────────────────────────
    private Double principalWO;
    private Double interestWO;
    private Double feesWO;
    private Double writeOffAmount;  // total

    // ── Metadata ─────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "write_off_reason", columnDefinition = "varchar(30)")
    private WriteOffReason writeOffReason;

    private String reason;          // free-text fallback / legacy
    private String approvedBy;
    private LocalDate chargeOffDate;
    private LocalDate approvalDate;

    @Column(length = 1000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private WriteOffStatus status;

    // ── Audit trail ─────────────────────────────────────────────────────────
    private String createdBy;
    private LocalDateTime createdDate;
    private String modifiedBy;
    private LocalDateTime modifiedDate;

    @Column(length = 50)
    private String previousStatus;
}
