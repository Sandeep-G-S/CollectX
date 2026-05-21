package com.collectx.portfolio.dto;

import lombok.Data;

@Data
public class LoanResponseDTO {
    private Long loanAccountId;
    private Long customerId;
    private String product;
    private Double principalOS;
    private Double interestOS;
    private Integer dpd;
    private String bucket;
    private String lastPaymentDate;
    private String region;
    private String status;
}
