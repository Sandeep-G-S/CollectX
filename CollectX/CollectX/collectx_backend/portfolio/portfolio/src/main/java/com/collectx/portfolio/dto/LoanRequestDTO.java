package com.collectx.portfolio.dto;

import lombok.Data;

@Data
public class LoanRequestDTO {
    private Long customerId;
    private String product;
    private Double principalOS;
    private Double interestOS;
    private String lastPaymentDate;
    private String region;
}
