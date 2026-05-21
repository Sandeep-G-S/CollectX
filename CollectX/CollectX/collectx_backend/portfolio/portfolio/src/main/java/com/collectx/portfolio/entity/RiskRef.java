package com.collectx.portfolio.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class RiskRef {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long riskId;

    private Long loanAccountId;

    private Integer bureauScore;
    private Integer internalScore;

    private String riskBand;
    private LocalDate asOfDate;
}
