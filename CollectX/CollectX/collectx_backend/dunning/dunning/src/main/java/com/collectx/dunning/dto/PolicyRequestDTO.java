package com.collectx.dunning.dto;

import lombok.Data;

import java.util.List;

@Data
public class PolicyRequestDTO {
    private String       bucket;            // "0-30" | "31-60" | "61-90" | "90+"
    private Integer      maxAttemptsPerDay;
    private Integer      minGapMinutes;
    private List<String> preferredChannels; // e.g. ["CALL","INAPP","SMS"]
    private Boolean      doNotCall;
}
