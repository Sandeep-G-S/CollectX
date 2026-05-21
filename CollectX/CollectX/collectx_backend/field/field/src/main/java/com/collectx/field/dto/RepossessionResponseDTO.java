package com.collectx.field.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned after creating / listing repossessions.
 */
@Data
@Builder
public class RepossessionResponseDTO {
    private Long repossessionId;
    private Long loanAccountId;
    private Long agentId;
    private String assetDescription;
    private Double estimatedValue;
    private String repossessedDate;
    private String status;
}
