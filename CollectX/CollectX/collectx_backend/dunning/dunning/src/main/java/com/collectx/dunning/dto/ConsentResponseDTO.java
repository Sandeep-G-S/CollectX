package com.collectx.dunning.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsentResponseDTO {
    private Long   consentId;
    private Long   customerId;
    private String channel;
    private String status;
}
