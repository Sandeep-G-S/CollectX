package com.collectx.payment.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned for Settlement responses.
 */
@Data
@Builder
public class SettlementResponseDTO {
    private Long settlementId;
    private Long loanAccountId;
    private Long agentId;
    private Long customerId;
    private Double settlementAmount;
    private Double waiverAmount;
    private String reason;
    private String approvalStatus; // REQUESTED / APPROVED / REJECTED
    private String status;         // ACTIVE / COMPLETED
}
