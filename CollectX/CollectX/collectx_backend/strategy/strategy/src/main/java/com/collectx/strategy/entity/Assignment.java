package com.collectx.strategy.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assignmentId;

    private Long loanAccountId;
    private Long agentId;
    private Long queueId;

    private LocalDate assignedDate;

    private String status; // OPEN / CLOSED / REASSIGNED
}