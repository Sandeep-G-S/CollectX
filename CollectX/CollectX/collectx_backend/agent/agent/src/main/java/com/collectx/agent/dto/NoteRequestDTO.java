package com.collectx.agent.dto;

import lombok.Data;

@Data
public class NoteRequestDTO {
    private Long loanAccountId;
    private Long agentId;
    private String note;
    private String noteType;
}
