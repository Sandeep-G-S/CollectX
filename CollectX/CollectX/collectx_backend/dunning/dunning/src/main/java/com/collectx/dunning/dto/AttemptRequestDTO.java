package com.collectx.dunning.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AttemptRequestDTO {
    private Long   loanAccountId;
    private Long   agentId;
    private Long   customerId;
    private String bucket;          // e.g. "0-30", "31-60", "61-90", "90+"
    private String channel;         // CALL | VISIT | INAPP | SMS | EMAIL
    private String outcome;         // CONNECTED | NO_ANSWER | REFUSED
    private String notes;
    private LocalDateTime attemptTime; // optional — defaults to now
}
