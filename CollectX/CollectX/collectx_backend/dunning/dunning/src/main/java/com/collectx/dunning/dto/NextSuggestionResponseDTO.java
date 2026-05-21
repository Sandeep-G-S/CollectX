package com.collectx.dunning.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class NextSuggestionResponseDTO {
    private Long          loanAccountId;
    private String        bucket;
    private List<String>  preferredChannels; // ordered preference list from policy
    private String        suggestedChannel;  // null when no channel is eligible
    private String        reasonOrNote;      // "ELIGIBLE" | "MAX_ATTEMPTS_REACHED" | "MIN_GAP_NOT_MET" | "NO_ELIGIBLE_CHANNEL"
    private LocalDateTime eligibleAt;        // when the next attempt is allowed
}
