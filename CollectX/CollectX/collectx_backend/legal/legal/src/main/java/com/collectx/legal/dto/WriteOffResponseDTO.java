package com.collectx.legal.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned for Write-Off responses.
 */
@Data
@Builder
public class WriteOffResponseDTO {
    private Long writeOffId;
    private Long loanAccountId;
    private Long customerId;

    // Amount breakdown
    private Double principalWO;
    private Double interestWO;
    private Double feesWO;
    private Double writeOffAmount;

    // Metadata
    private String writeOffReason;
    private String reason;
    private String approvedBy;
    private String chargeOffDate;
    private String approvalDate;
    private String notes;
    private String status;

    // Audit trail
    private String createdBy;
    private String createdDate;
    private String modifiedBy;
    private String modifiedDate;
    private String previousStatus;
}
