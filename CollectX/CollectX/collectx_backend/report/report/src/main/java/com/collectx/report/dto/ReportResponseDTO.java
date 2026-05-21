package com.collectx.report.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReportResponseDTO {
    private Long reportId;
    private String scope;
    private Double cashCollected;
    private Double ptpKeptPct;
    private Double cureRate;
    private Double rollRate;
    private Double collectionEfficiency;
    private String generatedDate;
}
