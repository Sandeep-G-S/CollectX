package com.collectx.agent.dto;

import lombok.Data;

@Data
public class TaskRequestDTO {
    private Long loanAccountId;
    private Long agentId;
    private String dueDate;   // "yyyy-MM-dd"
    private String taskType;  // CALL / VISIT / EMAIL / PTP_FOLLOW_UP
    private String priority;
}
