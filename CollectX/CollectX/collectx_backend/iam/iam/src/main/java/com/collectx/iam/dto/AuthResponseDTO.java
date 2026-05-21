package com.collectx.iam.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponseDTO {
    private String token;
    private String email;
    private String role;
    private long expiresInSeconds;  // 36000 = 10 hours
}
