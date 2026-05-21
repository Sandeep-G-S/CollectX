package com.collectx.dunning.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PolicyResponseDTO {
    private Long         policyId;
    private String       bucket;
    private Integer      maxAttemptsPerDay;
    private Integer      minGapMinutes;
    private List<String> preferredChannels;
    private Boolean      doNotCall;
}
