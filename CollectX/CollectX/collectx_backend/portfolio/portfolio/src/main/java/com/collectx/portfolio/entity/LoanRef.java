package com.collectx.portfolio.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class LoanRef {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long loanAccountId;

    private Long customerId;
    private String product;

    private Double principalOS;
    private Double interestOS;

    private Integer dpd;
    private String bucket;

    private LocalDate lastPaymentDate;

    private String region;
    private String status;
}
