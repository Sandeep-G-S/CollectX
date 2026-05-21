package com.collectx.field.entity;

import com.collectx.field.enums.AgencyStatus;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Agency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long agencyId;

    private String name;
    private String territory;
    private Double commissionPct;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private AgencyStatus status;
}
