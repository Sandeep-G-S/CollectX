package com.collectx.strategy.controller;

import com.collectx.strategy.dto.AssignmentResponseDTO;
import com.collectx.strategy.dto.RuleRequestDTO;
import com.collectx.strategy.dto.RuleResponseDTO;
import com.collectx.strategy.entity.Assignment;
import com.collectx.strategy.service.StrategyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/strategy")
@RequiredArgsConstructor
public class StrategyController {

    private final StrategyService service;

    // ── ASSIGN LOAN (called by Portfolio service via Feign) ───────────────────
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/assign")
    public Assignment assign(@RequestBody Map<String, String> req,
                             @RequestHeader("Authorization") String token) {
        return service.assignLoan(
                Long.parseLong(req.get("loanAccountId")),
                req.get("bucket"),
                req.get("riskBand"),
                token
        );
    }

    // ── CREATE STRATEGY RULE ──────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/rule")
    public RuleResponseDTO addRule(@RequestBody RuleRequestDTO dto) {
        return service.createRule(dto);
    }

    // ── GET ALL ASSIGNMENTS ───────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'AGENT')")
    @GetMapping("/assignments")
    public List<AssignmentResponseDTO> getAll() {
        return service.getAssignments();
    }

    // ── GET ALL STRATEGY RULES ────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @GetMapping("/rules")
    public List<RuleResponseDTO> getRules() {
        return service.getRules();
    }
}
