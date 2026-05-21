package com.collectx.field.dto;

import lombok.Data;

/**
 * DTO for creating a new Field Visit.
 * Accepts visitDate as "yyyy-MM-dd" string from the frontend.
 */
@Data
public class VisitRequestDTO {
    private Long loanAccountId;
    private Long agentId;
    private Long customerId;
    private String visitDate;    // "yyyy-MM-dd" — parsed to LocalDate in service
    private String address;
    private String outcome;      // enum value: CONNECTED / NOT_HOME / REFUSED / PARTIAL_PAYMENT / PTP_GIVEN
    private String notes;
    private String visitType;    // SCHEDULED (future) or COMPLETED (already done)
}
