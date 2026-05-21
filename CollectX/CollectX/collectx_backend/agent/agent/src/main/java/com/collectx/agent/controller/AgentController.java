package com.collectx.agent.controller;

import com.collectx.agent.dto.*;
import com.collectx.agent.service.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService service;

    // ── PTP ───────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR')")
    @PostMapping("/ptp")
    public String createPTP(@RequestBody AgentPTPRequestDTO dto,
                            @RequestHeader("Authorization") String token) {
        return service.createPTPFromAgent(dto, token);
    }

    // ── CASE ──────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR')")
    @PostMapping("/case")
    public CaseResponseDTO createCase(@RequestBody CaseRequestDTO dto) {
        return service.createCase(dto);
    }

    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR', 'COMPLIANCE')")
    @GetMapping("/cases/{loanId}")
    public List<CaseResponseDTO> getCases(@PathVariable Long loanId) {
        return service.getCases(loanId);
    }

    // ── NOTE ──────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR')")
    @PostMapping("/note")
    public NoteResponseDTO addNote(@RequestBody NoteRequestDTO dto) {
        return service.addNote(dto);
    }

    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR')")
    @GetMapping("/notes/loan/{loanId}")
    public List<NoteResponseDTO> getNotesByLoan(@PathVariable Long loanId) {
        return service.getNotesByLoan(loanId);
    }

    // ── TASK ──────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR')")
    @PostMapping("/task")
    public TaskResponseDTO createTask(@RequestBody TaskRequestDTO dto) {
        return service.createTask(dto);
    }

    @PreAuthorize("hasAnyRole('AGENT', 'SUPERVISOR')")
    @GetMapping("/tasks/agent/{agentId}")
    public List<TaskResponseDTO> getTasksByAgent(@PathVariable Long agentId) {
        return service.getTasksByAgent(agentId);
    }
}
