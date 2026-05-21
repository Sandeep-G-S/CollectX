package com.collectx.iam.dto;

import com.collectx.iam.entity.Role;
import lombok.Data;

@Data
public class RegisterRequestDTO {
    // userId is optional — if not provided, the database auto-generates it
    private Long userId;
    private String name;
    private String email;
    private String password;
    private Role role;
}
