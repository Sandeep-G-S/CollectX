package com.collectx.dunning.controller;

import com.collectx.dunning.dto.NextSuggestionResponseDTO;
import com.collectx.dunning.service.OrchestrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dunning/orchestration")
@RequiredArgsConstructor
public class OrchestrationController {

    private final OrchestrationService orchestrationService;

    /**
     * GET /dunning/orchestration/loans/{loanAccountId}/next-suggestion
     *       ?bucket=90%2B&customerId=123
     *
     * The frontend already has bucket + customerId from the loan table,
     * so they are passed as query params — no extra service call needed.
     *
     * Response includes:
     *   - suggestedChannel  (null = no channel eligible right now)
     *   - reasonOrNote      (ELIGIBLE | MAX_ATTEMPTS_REACHED | MIN_GAP_NOT_MET | NO_ELIGIBLE_CHANNEL)
     *   - eligibleAt        (LocalDateTime when the next attempt is allowed)
     */
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISOR')")
    @GetMapping("/loans/{loanAccountId}/next-suggestion")
    public NextSuggestionResponseDTO suggest(
            @PathVariable Long   loanAccountId,
            @RequestParam String bucket,
            @RequestParam Long   customerId) {

        return orchestrationService.nextSuggestion(loanAccountId, bucket, customerId);
    }
}
