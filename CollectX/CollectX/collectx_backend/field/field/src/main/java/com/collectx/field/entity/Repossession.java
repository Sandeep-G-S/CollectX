package com.collectx.field.entity;

import com.collectx.field.enums.RepossessionStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class Repossession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long repossessionId;

    private Long loanAccountId;
    private Long agentId;

    private String assetDescription;
    private LocalDate repossessedDate;
    private Double estimatedValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private RepossessionStatus status;
}
