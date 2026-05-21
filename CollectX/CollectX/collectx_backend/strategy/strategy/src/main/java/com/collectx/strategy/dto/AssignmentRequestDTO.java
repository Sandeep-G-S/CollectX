package com.collectx.strategy.dto;

import lombok.Data;

/**
 * DTO for triggering a loan assignment via the Strategy module.
 * Sent by Portfolio service (via Feign) when a new loan is ingested.
 */
@Data
public class AssignmentRequestDTO {
    private Long loanAccountId;
    private String bucket;    // e.g. "31-60"
    private String riskBand;  // e.g. "HIGH"
}
