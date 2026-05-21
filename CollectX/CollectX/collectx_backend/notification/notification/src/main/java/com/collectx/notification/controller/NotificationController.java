package com.collectx.notification.controller;

import com.collectx.notification.dto.NotificationRequestDTO;
import com.collectx.notification.dto.NotificationResponseDTO;
import com.collectx.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notify")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/create")
    public NotificationResponseDTO create(@RequestBody NotificationRequestDTO dto) {
        return service.create(dto);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/all")
    public List<NotificationResponseDTO> getAll() {
        return service.getAll();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/customer/{customerId}")
    public List<NotificationResponseDTO> getByCustomer(@PathVariable Long customerId) {
        return service.getByCustomer(customerId);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/loan/{loanAccountId}")
    public List<NotificationResponseDTO> getByLoan(@PathVariable Long loanAccountId) {
        return service.getByLoan(loanAccountId);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{loanAccountId}")
    public List<NotificationResponseDTO> getByLoanDirect(@PathVariable Long loanAccountId) {
        return service.getByLoan(loanAccountId);
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}/read")
    public NotificationResponseDTO markAsRead(@PathVariable Long id) {
        return service.markAsRead(id);
    }
}
