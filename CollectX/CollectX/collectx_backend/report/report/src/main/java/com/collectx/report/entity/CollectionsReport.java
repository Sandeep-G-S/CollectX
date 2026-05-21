package com.collectx.report.entity;

import com.collectx.report.enums.ReportScope;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class CollectionsReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", columnDefinition = "varchar(30)")
    private ReportScope scope;

    private Double cashCollected;
    private Double ptpKeptPct;
    private Double cureRate;
    private Double rollRate;
    private Double collectionEfficiency;

    private LocalDate generatedDate;
}
