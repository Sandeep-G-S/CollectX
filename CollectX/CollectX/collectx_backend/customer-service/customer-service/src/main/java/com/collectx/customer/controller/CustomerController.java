package com.collectx.customer.controller;

import com.collectx.customer.dto.CustomerRequestDTO;
import com.collectx.customer.dto.CustomerResponseDTO;
import com.collectx.customer.entity.CustomerStatus;
import com.collectx.customer.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/customer")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    // ── CREATE ────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/create")
    public ResponseEntity<CustomerResponseDTO> create(@RequestBody CustomerRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.create(dto));
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getById(id));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/all")
    public ResponseEntity<List<CustomerResponseDTO>> getAll() {
        return ResponseEntity.ok(customerService.getAll());
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/search")
    public ResponseEntity<List<CustomerResponseDTO>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String status) {

        if (name   != null) return ResponseEntity.ok(customerService.searchByName(name));
        if (email  != null) return ResponseEntity.ok(List.of(customerService.getByEmail(email)));
        if (phone  != null) return ResponseEntity.ok(List.of(customerService.getByPhone(phone)));
        if (status != null) return ResponseEntity.ok(customerService.getByStatus(CustomerStatus.valueOf(status.toUpperCase())));

        return ResponseEntity.ok(customerService.getAll());
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponseDTO> update(@PathVariable Long id,
                                                      @RequestBody CustomerRequestDTO dto) {
        return ResponseEntity.ok(customerService.update(id, dto));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}/consent")
    public ResponseEntity<CustomerResponseDTO> updateConsent(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> consent) {
        return ResponseEntity.ok(customerService.updateConsent(id, consent));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        customerService.updateStatus(id, CustomerStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok().build();
    }
}
