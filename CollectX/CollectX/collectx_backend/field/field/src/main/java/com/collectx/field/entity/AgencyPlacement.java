package com.collectx.field.entity;

import com.collectx.field.enums.PlacementStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class AgencyPlacement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long placementId;

    private Long loanAccountId;
    private Long agencyId;
    private String agencyName;

    private LocalDate placementDate;
    private Double outstandingAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private PlacementStatus status;
}
