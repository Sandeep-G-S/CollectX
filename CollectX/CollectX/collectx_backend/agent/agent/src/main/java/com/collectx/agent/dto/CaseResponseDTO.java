package com.collectx.agent.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CaseResponseDTO {
    private Long caseId;
    private Long loanAccountId;
    private String caseType;
    private String priority;
    private String status;
    private String openedDate;
}
