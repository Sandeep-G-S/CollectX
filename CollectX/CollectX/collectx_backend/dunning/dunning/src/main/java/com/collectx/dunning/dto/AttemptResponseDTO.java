package com.collectx.dunning.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AttemptResponseDTO {
    private Long          attemptId;
    private Long          loanAccountId;
    private Long          agentId;
    private String        channel;
    private String        outcome;
    private String        notes;
    private LocalDateTime attemptTime;
}
