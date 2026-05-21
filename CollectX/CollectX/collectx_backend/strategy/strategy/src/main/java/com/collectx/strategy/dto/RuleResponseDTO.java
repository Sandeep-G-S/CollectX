package com.collectx.strategy.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned for Strategy Rule responses.
 */
@Data
@Builder
public class RuleResponseDTO {
    private Long ruleId;
    private String name;
    private String bucket;
    private String riskBand;
    private Integer priority;
    private String status;
    private String expression;
}
