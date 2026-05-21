package com.collectx.customer.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerResponseDTO {
    private Long customerId;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pinCode;
    private String dateOfBirth;
    private String status;
    private Boolean consentSms;
    private Boolean consentEmail;
    private Boolean consentCall;
    private String createdAt;
    private String updatedAt;
}
