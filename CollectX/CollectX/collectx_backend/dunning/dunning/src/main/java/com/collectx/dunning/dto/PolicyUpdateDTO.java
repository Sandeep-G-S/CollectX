package com.collectx.dunning.dto;

import lombok.Data;

import java.util.List;

/** Patch-style update — all fields optional (null = unchanged). */
@Data
public class PolicyUpdateDTO {
    private Integer      maxAttemptsPerDay;
    private Integer      minGapMinutes;
    private List<String> preferredChannels;
    private Boolean      doNotCall;
}
