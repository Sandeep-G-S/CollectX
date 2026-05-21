package com.collectx.field.controller;

import com.collectx.field.dto.*;
import com.collectx.field.service.FieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/field")
@RequiredArgsConstructor
public class FieldController {

    private final FieldService service;

    // ── CREATE FIELD VISIT ────────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('FIELD', 'SUPERVISOR')")
    @PostMapping("/visit")
    public VisitResponseDTO visit(@RequestBody VisitRequestDTO dto) {
        return service.scheduleVisit(dto);
    }

    // ── CREATE REPOSSESSION ───────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('FIELD', 'SUPERVISOR', 'ADMIN')")
    @PostMapping("/repossession")
    public RepossessionResponseDTO repo(@RequestBody RepossessionRequestDTO dto) {
        return service.createRepossession(dto);
    }

    // ── CREATE AGENCY PLACEMENT ───────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'FIELD')")
    @PostMapping("/agency-placement")
    public AgencyPlacementResponseDTO assign(@RequestBody AgencyPlacementRequestDTO dto) {
        return service.assignAgency(dto);
    }

    // ── GET ALL FIELD VISITS ──────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('FIELD', 'SUPERVISOR', 'ADMIN', 'COMPLIANCE', 'RECOVERY')")
    @GetMapping("/visits")
    public List<VisitResponseDTO> getAllVisits() {
        return service.getAllVisits();
    }

    // ── GET ALL REPOSSESSIONS ─────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('FIELD', 'SUPERVISOR', 'ADMIN', 'COMPLIANCE', 'RECOVERY')")
    @GetMapping("/repossessions")
    public List<RepossessionResponseDTO> getAllRepossessions() {
        return service.getAllRepossessions();
    }

    // ── GET ALL AGENCY PLACEMENTS ─────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'FIELD', 'COMPLIANCE', 'RECOVERY')")
    @GetMapping("/agency-placements")
    public List<AgencyPlacementResponseDTO> getAllPlacements() {
        return service.getAllPlacements();
    }
}
