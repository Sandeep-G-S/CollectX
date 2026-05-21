package com.collectx.strategy.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class StrategyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ruleId;

    private String name;

    private String bucket;   // Example: "31-60"
    private String riskBand; // Example: "HIGH"

    private Integer priority;

    private String status;     // ACTIVE / INACTIVE
    private String expression; // optional DSL/JSON — e.g. {"bucket":"90+","riskBand":"HIGH"}
}