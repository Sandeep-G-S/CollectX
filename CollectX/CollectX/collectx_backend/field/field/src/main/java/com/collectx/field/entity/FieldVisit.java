package com.collectx.field.entity;

import com.collectx.field.enums.VisitOutcome;
import com.collectx.field.enums.VisitType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class FieldVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long visitId;

    private Long loanAccountId;
    private Long agentId;
    private Long customerId;

    private LocalDate visitDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", columnDefinition = "varchar(30)")
    private VisitOutcome outcome;     // null for SCHEDULED visits

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_type", columnDefinition = "varchar(30)")
    private VisitType visitType;      // SCHEDULED / COMPLETED

    private String notes;
    private String address;
}
