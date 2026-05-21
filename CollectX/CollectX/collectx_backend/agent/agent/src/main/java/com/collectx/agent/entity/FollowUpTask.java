package com.collectx.agent.entity;

import com.collectx.agent.enums.TaskStatus;
import com.collectx.agent.enums.TaskType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class FollowUpTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long taskId;

    private Long loanAccountId;
    private Long agentId;
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", columnDefinition = "varchar(30)")
    private TaskType taskType;

    private String priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private TaskStatus status;
}
