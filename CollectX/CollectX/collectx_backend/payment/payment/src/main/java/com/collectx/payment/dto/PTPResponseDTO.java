package com.collectx.payment.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned for PTP responses.
 * Includes audit trail fields so the UI can show who created / last modified.
 */
@Data
@Builder
public class PTPResponseDTO {
    private Long   ptpId;
    private Long   loanAccountId;
    private Long   agentId;
    private Long   customerId;
    private Double promisedAmount;
    private String promisedDate;
    private String channel;
    private String promisedBy;
    private String notes;
    private String status;

    // Audit
    private String createdBy;
    private String createdDate;
    private String modifiedBy;
    private String modifiedDate;
    private String previousStatus;
    private String newStatus;
}
