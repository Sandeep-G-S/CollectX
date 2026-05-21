package com.collectx.report.entity;

import com.collectx.report.enums.PeriodType;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class AgentPerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long perfId;

    private Long agentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "period", columnDefinition = "varchar(30)")
    private PeriodType period;

    private Integer accountsWorked;
    private Integer contactsMade;
    private Integer ptpsBooked;
    private Integer ptpKept;
    private Double amountCollected;
}
