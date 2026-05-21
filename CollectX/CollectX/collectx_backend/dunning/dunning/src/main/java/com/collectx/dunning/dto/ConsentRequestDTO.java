package com.collectx.dunning.dto;

import lombok.Data;

@Data
public class ConsentRequestDTO {
    private Long   customerId;
    private String channel;  // CALL | VISIT | INAPP | SMS | EMAIL
    private String status;   // OPTIN | OPTOUT
}
