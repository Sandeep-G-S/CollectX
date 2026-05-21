package com.collectx.field.dto;

import lombok.Data;

/**
 * DTO for creating an Agency Placement (ADMIN only).
 */
@Data
public class AgencyPlacementRequestDTO {
    private Long loanAccountId;
    private Long agencyId;
    private String agencyName;
    private String placementDate;    // "yyyy-MM-dd"
    private Double outstandingAmount;
}
