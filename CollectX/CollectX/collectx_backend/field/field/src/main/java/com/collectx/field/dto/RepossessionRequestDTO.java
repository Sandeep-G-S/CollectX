package com.collectx.field.dto;

import lombok.Data;

/**
 * DTO for recording a Repossession.
 */
@Data
public class RepossessionRequestDTO {
    private Long loanAccountId;
    private Long agentId;
    private String assetDescription;
    private Double estimatedValue;
    private String repossessedDate;  // "yyyy-MM-dd"
}
