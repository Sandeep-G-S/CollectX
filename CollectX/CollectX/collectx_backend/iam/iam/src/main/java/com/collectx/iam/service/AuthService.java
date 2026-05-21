package com.collectx.iam.service;

import com.collectx.iam.dto.AuthResponseDTO;
import com.collectx.iam.dto.RegisterRequestDTO;
import com.collectx.iam.entity.Role;
import com.collectx.iam.entity.User;
import com.collectx.iam.entity.UserStatus;
import com.collectx.iam.repository.UserRepository;
import com.collectx.iam.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // Token validity in seconds = 10 hours
    private static final long EXPIRES_IN_SECONDS = 60 * 60 * 10;

    public String register(RegisterRequestDTO dto) {
        log.info("Registering new user email={} role={}", dto.getEmail(), dto.getRole());

        // Validate unique email
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already exists: " + dto.getEmail());
        }
        // Enforce minimum password length
        if (dto.getPassword() == null || dto.getPassword().length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters");
        }

        User user = new User();
        // userId is always auto-generated — never set from the request
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setRole(dto.getRole());
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        return "User Registered";
    }

    /** Returns user IDs of all users with AGENT role — used by strategy service for round-robin assignment. */
    public List<Long> getAgentIds() {
        return userRepository.findByRole(Role.AGENT)
                .stream()
                .map(User::getUserId)
                .collect(Collectors.toList());
    }

    /**
     * Internal check: does an agent with this userId exist?
     * Used by agent/field/legal services to validate agentId before saving records.
     */
    public boolean agentExists(Long userId) {
        return userRepository.findById(userId)
                .map(u -> u.getRole() == Role.AGENT)
                .orElse(false);
    }

    public AuthResponseDTO login(String email, String password) {
        log.info("Login attempt for email={}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponseDTO(
                token,
                user.getEmail(),
                user.getRole().name(),
                EXPIRES_IN_SECONDS
        );
    }
}
