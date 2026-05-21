package com.collectx.legal.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned for Recovery responses.
 */
@Data
@Builder
public class RecoveryResponseDTO {
    private Long recoveryId;
    private Long loanAccountId;
    private Long customerId;
    private Double recoveredAmount;
    private String recoveryType;
    private String recoveryDate;
    private String source;
    private String recoveryMode;
    private String status;
    private Long linkedWriteOffId;
    private String notes;

    // Audit trail
    private String createdBy;
    private String createdDate;
    private String modifiedBy;
    private String modifiedDate;
    private String previousStatus;
}
