package com.collectx.legal.dto;

import lombok.Data;

/**
 * DTO for initiating a Write-Off (ADMIN only).
 * Status is always forced to PENDING by the service layer.
 */
@Data
public class WriteOffRequestDTO {
    private Long loanAccountId;
    private Long customerId;

    // Amount breakdown
    private Double principalWO;
    private Double interestWO;
    private Double feesWO;
    private Double writeOffAmount;   // optional total override; computed from breakdown if absent

    // Metadata
    private String writeOffReason;   // WriteOffReason enum value as string
    private String reason;           // free-text description
    private String approvedBy;
    private String chargeOffDate;    // "yyyy-MM-dd"
    private String approvalDate;     // "yyyy-MM-dd"
    private String notes;
}
