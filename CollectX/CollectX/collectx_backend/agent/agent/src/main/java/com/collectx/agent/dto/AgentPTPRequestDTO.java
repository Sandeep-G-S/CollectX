package com.collectx.agent.dto;

import lombok.Data;

@Data
public class AgentPTPRequestDTO {
    private Long loanAccountId;
    private Double amount;
    private String promisedDate;   // ISO date string "YYYY-MM-DD" — chosen by the agent in the UI
}
