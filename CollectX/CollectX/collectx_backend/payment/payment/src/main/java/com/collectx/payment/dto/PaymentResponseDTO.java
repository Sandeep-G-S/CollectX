package com.collectx.payment.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned for Payment responses.
 * Includes audit trail so UI can show verify/close history.
 */
@Data
@Builder
public class PaymentResponseDTO {
    private Long   paymentId;
    private Long   loanAccountId;
    private Long   agentId;
    private Long   customerId;
    private Double amount;
    private String paymentDate;
    private String paymentMode;
    private String referenceNumber;
    private String status;

    // Audit
    private String createdBy;
    private String createdDate;
    private String modifiedBy;
    private String modifiedDate;
    private String previousStatus;
    private String newStatus;
}
