package com.collectx.agent.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoteResponseDTO {
    private Long noteId;
    private Long loanAccountId;
    private Long agentId;
    private String note;
    private String noteType;
    private String createdAt;
}
