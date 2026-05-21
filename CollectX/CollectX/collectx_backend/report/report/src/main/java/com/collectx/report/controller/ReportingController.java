package com.collectx.report.controller;

import com.collectx.report.dto.AgentPerformanceRequestDTO;
import com.collectx.report.dto.AgentPerformanceResponseDTO;
import com.collectx.report.dto.ReportResponseDTO;
import com.collectx.report.service.ReportingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/report")
@RequiredArgsConstructor
public class ReportingController {

    private final ReportingService service;

    // ── GENERATE KPI REPORT ───────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/generate")
    public ReportResponseDTO generate() {
        return service.generateReport();
    }

    // ── AGENT PERFORMANCE ─────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'COMPLIANCE')")
    @PostMapping("/performance")
    public AgentPerformanceResponseDTO perf(@RequestBody AgentPerformanceRequestDTO dto) {
        return service.savePerformance(dto);
    }

    // ── GET REPORTS ───────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'COMPLIANCE')")
    @GetMapping("/all")
    public List<ReportResponseDTO> getAll() {
        return service.getReports();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'COMPLIANCE')")
    @GetMapping("/kpi")
    public ReportResponseDTO getKpi() {
        return service.getLatestKpi();
    }

    // ── AGENT PERFORMANCE (GET) ───────────────────────────────────────────────
    // Returns all performance records mapped to frontend-friendly field names.
    // Falls back to synthetic demo data when no records exist.
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'COMPLIANCE', 'FIELD', 'RECOVERY')")
    @GetMapping("/agent-performance")
    public List<AgentPerformanceResponseDTO> getAgentPerformance() {
        return service.getAllPerformance();
    }
}
