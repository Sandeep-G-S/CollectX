package com.collectx.legal.dto;

import lombok.Data;

/**
 * DTO for recording a Recovery entry.
 * Status is always forced to RECORDED by the service layer.
 */
@Data
public class RecoveryRequestDTO {
    private Long loanAccountId;
    private Long customerId;
    private Double recoveredAmount;
    private String recoveryDate;      // "yyyy-MM-dd"
    private String recoveryType;      // legacy free-text
    private String source;            // RecoverySource enum: AGENCY / LEGAL / WALK_IN / SETTLEMENT
    private String recoveryMode;      // RecoveryMode enum: CASH / CHEQUE / NEFT / RTGS / UPI
    private Long linkedWriteOffId;
    private String notes;
}
