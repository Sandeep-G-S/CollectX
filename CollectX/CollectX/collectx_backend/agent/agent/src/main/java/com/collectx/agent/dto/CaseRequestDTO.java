package com.collectx.agent.dto;

import lombok.Data;

@Data
public class CaseRequestDTO {
    private Long loanAccountId;
    private String caseType;   // HARD_SHIP / LEGAL / COLLECTIONS
    private String priority;   // LOW / MEDIUM / HIGH / CRITICAL
}
