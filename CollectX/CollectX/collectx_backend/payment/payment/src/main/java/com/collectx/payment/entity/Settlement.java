package com.collectx.payment.entity;

import com.collectx.payment.enums.ApprovalStatus;
import com.collectx.payment.enums.SettlementStatus;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long settlementId;

    private Long loanAccountId;
    private Long agentId;
    private Long customerId;

    private Double settlementAmount;
    private Double waiverAmount;
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", columnDefinition = "varchar(30)")
    private ApprovalStatus approvalStatus; // REQUESTED / APPROVED / REJECTED

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private SettlementStatus status;       // ACTIVE / COMPLETED
}
