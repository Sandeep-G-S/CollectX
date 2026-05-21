package com.collectx.payment.dto;

import lombok.Data;

/**
 * DTO for recording a payment.
 */
@Data
public class PaymentRequestDTO {
    private Long loanAccountId;
    private Long agentId;
    private Long customerId;
    private Double amount;
    private String paymentMode;      // CASH / CHEQUE / UPI / NEFT / RTGS
    private String referenceNumber;
    private String paymentDate;      // "yyyy-MM-dd" — defaults to today on server if omitted
}
