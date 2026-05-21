package com.collectx.dunning.controller;

import com.collectx.dunning.dto.PolicyRequestDTO;
import com.collectx.dunning.dto.PolicyResponseDTO;
import com.collectx.dunning.dto.PolicyUpdateDTO;
import com.collectx.dunning.service.PolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dunning/policies")
@RequiredArgsConstructor
public class PoliciesController {

    private final PolicyService policyService;

    // ── CREATE POLICY ─────────────────────────────────────────────────────────
    // One policy per bucket (0-30, 31-60, 61-90, 90+)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public PolicyResponseDTO create(@RequestBody PolicyRequestDTO req) {
        return policyService.create(req);
    }

    // ── UPDATE POLICY ─────────────────────────────────────────────────────────
    // Patch-style: only non-null fields are updated
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{bucket}")
    public PolicyResponseDTO update(@PathVariable String bucket,
                                    @RequestBody PolicyUpdateDTO req) {
        return policyService.update(bucket, req);
    }

    // ── GET POLICY BY BUCKET ──────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE','SUPERVISOR','AGENT')")
    @GetMapping("/{bucket}")
    public PolicyResponseDTO get(@PathVariable String bucket) {
        return policyService.getByBucket(bucket);
    }
}
