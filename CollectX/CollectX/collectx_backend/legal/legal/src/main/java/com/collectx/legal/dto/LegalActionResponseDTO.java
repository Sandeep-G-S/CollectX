package com.collectx.legal.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO returned for Legal Action responses.
 */
@Data
@Builder
public class LegalActionResponseDTO {
    private Long legalActionId;
    private Long loanAccountId;
    private Long customerId;
    private String actionType;
    private String caseNumber;
    private String courtName;
    private String filedDate;
    private String nextHearingDate;
    private String assignedLawyer;
    private String status;
    private String notes;

    // Audit trail
    private String createdBy;
    private String createdDate;
    private String modifiedBy;
    private String modifiedDate;
    private String previousStatus;
}
