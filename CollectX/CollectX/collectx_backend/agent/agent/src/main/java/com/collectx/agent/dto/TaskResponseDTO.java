package com.collectx.agent.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskResponseDTO {
    private Long taskId;
    private Long loanAccountId;
    private Long agentId;
    private String dueDate;
    private String taskType;
    private String priority;
    private String status;
}
