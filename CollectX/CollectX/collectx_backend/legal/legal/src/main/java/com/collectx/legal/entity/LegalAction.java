package com.collectx.legal.entity;

import com.collectx.legal.enums.LegalStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
public class LegalAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long legalId;   // maps to existing DB column `legal_id` — do NOT rename

    private Long loanAccountId;
    private Long customerId;
    private String caseNumber;
    private String courtName;

    // Valid values: NOTICE / SUMMONS / ARBITRATION / CIVIL_SUIT / CRIMINAL_COMPLAINT / LOK_ADALAT
    @Column(length = 50)
    private String actionType;

    private LocalDate filedDate;
    private LocalDate nextHearingDate;

    @Column(length = 200)
    private String assignedLawyer;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private LegalStatus status;

    @Column(length = 1000)
    private String notes;

    // ── Audit trail ─────────────────────────────────────────────────────────
    private String createdBy;
    private LocalDateTime createdDate;
    private String modifiedBy;
    private LocalDateTime modifiedDate;

    @Column(length = 50)
    private String previousStatus;
}
