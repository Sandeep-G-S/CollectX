package com.collectx.customer.dto;

import lombok.Data;

@Data
public class CustomerRequestDTO {
    private Long customerId;       // manually assigned (not auto-generated)
    private String name;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pinCode;
    private String dateOfBirth;    // "yyyy-MM-dd" — parsed to LocalDate in service
    private String status;         // e.g. ACTIVE, INACTIVE, BLACKLISTED
    private Boolean consentSms;
    private Boolean consentEmail;
    private Boolean consentCall;
}
