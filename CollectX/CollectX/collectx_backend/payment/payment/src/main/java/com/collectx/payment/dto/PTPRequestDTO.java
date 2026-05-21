package com.collectx.payment.dto;

import lombok.Data;

/**
 * DTO for creating a Promise to Pay.
 * Status is NOT accepted from the client — server always sets it to OPEN.
 * promisedDate accepted as "yyyy-MM-dd" string.
 */
@Data
public class PTPRequestDTO {
    private Long   loanAccountId;
    private Long   agentId;
    private Long   customerId;
    private Double promisedAmount;
    private String promisedDate;   // "yyyy-MM-dd"
    private String channel;        // CALL / SMS / EMAIL / VISIT
    private String promisedBy;
    private String notes;          // optional free-text
}
