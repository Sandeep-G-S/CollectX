package com.collectx.iam.controller;

import com.collectx.iam.dto.AuthResponseDTO;
import com.collectx.iam.dto.LoginRequestDTO;
import com.collectx.iam.dto.RegisterRequestDTO;
import com.collectx.iam.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequestDTO dto) {
        return authService.register(dto);
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody LoginRequestDTO dto) {
        return authService.login(dto.getEmail(), dto.getPassword());
    }

    /**
     * Internal endpoint: returns IDs of all users with AGENT role.
     * Used by strategy-service for round-robin loan assignment.
     * Permitted to all (no JWT needed) because it's an internal service call.
     */
    @GetMapping("/agents")
    public List<Long> getAgentIds() {
        return authService.getAgentIds();
    }

    /**
     * Internal endpoint: checks whether a given userId belongs to an AGENT.
     * Used by agent/field/legal services to validate agentId before saving records.
     * No JWT required — internal service-to-service call only.
     */
    @GetMapping("/internal/agent/exists/{id}")
    public boolean agentExists(@PathVariable Long id) {
        return authService.agentExists(id);
    }
}
