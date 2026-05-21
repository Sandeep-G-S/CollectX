package com.collectx.report.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentPerformanceResponseDTO {
    private Long perfId;
    private Long agentId;
    private String period;
    private Integer accountsWorked;
    private Integer contactsMade;
    private Integer ptpsBooked;
    private Integer ptpKept;
    private Double amountCollected;

    // Frontend-friendly aliases (used by Reporting.jsx chart + scorecard)
    private String agentName;         // "Agent {agentId}" if not set
    private Double collectionAmount;  // same as amountCollected
    private Integer ptpCount;         // same as ptpsBooked
    private Integer visitCount;       // same as accountsWorked
    private Double connectRate;       // contactsMade / accountsWorked * 100
}
