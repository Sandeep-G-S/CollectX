package com.collectx.strategy.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned after an Assignment is created or listed.
 */
@Data
@Builder
public class AssignmentResponseDTO {
    private Long assignmentId;
    private Long loanAccountId;
    private Long agentId;
    private Long queueId;
    private String assignedDate;  // ISO string
    private String status;        // OPEN / CLOSED / REASSIGNED
}
