package com.collectx.report.dto;

import lombok.Data;

@Data
public class AgentPerformanceRequestDTO {
    private Long agentId;
    private String period;           // DAILY / WEEKLY / MONTHLY
    private Integer accountsWorked;
    private Integer contactsMade;
    private Integer ptpsBooked;
    private Integer ptpKept;
    private Double amountCollected;
}
