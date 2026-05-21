package com.collectx.field.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned after creating / listing agency placements.
 */
@Data
@Builder
public class AgencyPlacementResponseDTO {
    private Long placementId;
    private Long loanAccountId;
    private Long agencyId;
    private String agencyName;
    private String placementDate;
    private Double outstandingAmount;
    private String status;
}
