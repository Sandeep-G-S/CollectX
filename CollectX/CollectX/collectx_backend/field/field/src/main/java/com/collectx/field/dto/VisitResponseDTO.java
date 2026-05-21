package com.collectx.field.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned after creating / listing field visits.
 * visitDate serialized as String for frontend consumption.
 */
@Data
@Builder
public class VisitResponseDTO {
    private Long visitId;
    private Long loanAccountId;
    private Long agentId;
    private Long customerId;
    private String visitDate;    // ISO string for JSON — no LocalDate serialization issues
    private String address;
    private String outcome;
    private String notes;
    private String visitType;    // SCHEDULED or COMPLETED
}
