package com.collectx.dunning.entity;

import com.collectx.dunning.entity.enums.AttemptOutcome;
import com.collectx.dunning.entity.enums.Channel;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class ContactAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptId;

    private Long loanAccountId;
    private Long agentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", columnDefinition = "varchar(30)")
    private Channel channel;

    private LocalDateTime attemptTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", columnDefinition = "varchar(30)")
    private AttemptOutcome outcome;

    private String notes;
}
