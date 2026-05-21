package com.collectx.agent.entity;

import com.collectx.agent.enums.GenericStatus;
import com.collectx.agent.enums.HardshipReason;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class HardshipFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long hardshipId;

    private Long loanAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", columnDefinition = "varchar(30)")
    private HardshipReason reason;

    private LocalDate startDate;
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private GenericStatus status;
}
