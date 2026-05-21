package com.collectx.legal.entity;

import com.collectx.legal.enums.RecoveryMode;
import com.collectx.legal.enums.RecoverySource;
import com.collectx.legal.enums.RecoveryStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
public class Recovery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recoveryId;

    private Long loanAccountId;
    private Long customerId;
    private Double recoveredAmount;
    private String recoveryType;    // legacy free-text field
    private LocalDate recoveryDate;

    @Column(length = 1000)
    private String notes;

    // ── Structured fields ────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private RecoveryStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", columnDefinition = "varchar(30)")
    private RecoverySource source;

    @Enumerated(EnumType.STRING)
    @Column(name = "recovery_mode", columnDefinition = "varchar(30)")
    private RecoveryMode recoveryMode;

    private Long linkedWriteOffId;

    // ── Audit trail ─────────────────────────────────────────────────────────
    private String createdBy;
    private LocalDateTime createdDate;
    private String modifiedBy;
    private LocalDateTime modifiedDate;

    @Column(length = 50)
    private String previousStatus;
}
