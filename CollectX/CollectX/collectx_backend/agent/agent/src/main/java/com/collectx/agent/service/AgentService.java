package com.collectx.agent.service;

import com.collectx.agent.dto.*;
import com.collectx.agent.entity.CaseNote;
import com.collectx.agent.entity.CollectionCase;
import com.collectx.agent.entity.FollowUpTask;
import com.collectx.agent.enums.CaseStatus;
import com.collectx.agent.enums.CaseType;
import com.collectx.agent.enums.Priority;
import com.collectx.agent.enums.TaskStatus;
import com.collectx.agent.enums.TaskType;
import com.collectx.agent.feign.IamClient;
import com.collectx.agent.feign.PaymentClient;
import com.collectx.agent.feign.PortfolioClient;
import com.collectx.agent.repository.CaseRepository;
import com.collectx.agent.repository.NoteRepository;
import com.collectx.agent.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgentService {

    private static final Logger log = LoggerFactory.getLogger(AgentService.class);

    private final CaseRepository caseRepo;
    private final NoteRepository noteRepo;
    private final TaskRepository taskRepo;
    private final PaymentClient paymentClient;

    @Autowired(required = false)
    private PortfolioClient portfolioClient;

    @Autowired(required = false)
    private IamClient iamClient;

    // ── VALIDATION HELPERS ────────────────────────────────────────────────────

    private void validateLoanExists(Long loanAccountId) {
        if (portfolioClient != null) {
            try {
                if (!portfolioClient.loanExists(loanAccountId)) {
                    throw new RuntimeException("Loan account ID " + loanAccountId + " does not exist in portfolio");
                }
            } catch (RuntimeException e) {
                throw e;  // rethrow validation failures
            } catch (Exception e) {
                log.warn("Could not validate loan={} — portfolio service unreachable: {}", loanAccountId, e.getMessage());
            }
        }
    }

    private void validateAgentExists(Long agentId) {
        if (iamClient != null) {
            try {
                if (!iamClient.agentExists(agentId)) {
                    throw new RuntimeException("Agent ID " + agentId + " does not exist or is not an AGENT role user");
                }
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Could not validate agentId={} — iam service unreachable: {}", agentId, e.getMessage());
            }
        }
    }

    // ── PTP via Payment Service ────────────────────────────────────────────────

    public String createPTPFromAgent(AgentPTPRequestDTO dto, String token) {
        log.info("Agent creating PTP for loanAccountId={} amount={} promisedDate={}",
                dto.getLoanAccountId(), dto.getAmount(), dto.getPromisedDate());
        Map<String, Object> body = new HashMap<>();
        body.put("loanAccountId", dto.getLoanAccountId());
        body.put("promisedAmount", dto.getAmount());
        // Use the date chosen by the agent; fall back to today if none provided
        String date = (dto.getPromisedDate() != null && !dto.getPromisedDate().isBlank())
                ? dto.getPromisedDate()
                : LocalDate.now().toString();
        body.put("promisedDate", date);
        body.put("promisedBy", "Agent");
        paymentClient.createPTP(body);
        log.info("PTP forwarded to payment service for loanAccountId={} promisedDate={}", dto.getLoanAccountId(), date);
        return "PTP Created";
    }

    // ── CASE ──────────────────────────────────────────────────────────────────

    public CaseResponseDTO createCase(CaseRequestDTO dto) {
        log.info("Creating collection case for loanAccountId={} type={}", dto.getLoanAccountId(), dto.getCaseType());
        validateLoanExists(dto.getLoanAccountId());
        CollectionCase c = new CollectionCase();
        c.setLoanAccountId(dto.getLoanAccountId());
        c.setCaseType(dto.getCaseType() != null ? CaseType.valueOf(dto.getCaseType()) : null);
        c.setPriority(dto.getPriority() != null ? Priority.valueOf(dto.getPriority()) : null);
        c.setOpenedDate(LocalDate.now());
        c.setStatus(CaseStatus.OPEN);
        CollectionCase saved = caseRepo.save(c);
        log.info("Collection case created with id={}", saved.getCaseId());
        return toCaseResponse(saved);
    }

    public List<CaseResponseDTO> getCases(Long loanId) {
        log.debug("Fetching cases for loanAccountId={}", loanId);
        return caseRepo.findByLoanAccountId(loanId).stream().map(this::toCaseResponse).collect(Collectors.toList());
    }

    // ── NOTE ──────────────────────────────────────────────────────────────────

    public NoteResponseDTO addNote(NoteRequestDTO dto) {
        log.info("Adding case note for loanAccountId={} agentId={}", dto.getLoanAccountId(), dto.getAgentId());
        validateLoanExists(dto.getLoanAccountId());
        if (dto.getAgentId() != null) validateAgentExists(dto.getAgentId());
        CaseNote note = new CaseNote();
        note.setLoanAccountId(dto.getLoanAccountId());
        note.setAgentId(dto.getAgentId());
        note.setNote(dto.getNote());
        note.setNoteType(dto.getNoteType());
        note.setCreatedAt(java.time.LocalDateTime.now());
        CaseNote saved = noteRepo.save(note);
        log.info("Case note saved with id={}", saved.getNoteId());
        return toNoteResponse(saved);
    }

    public List<NoteResponseDTO> getNotesByLoan(Long loanAccountId) {
        log.debug("Fetching notes for loanAccountId={}", loanAccountId);
        return noteRepo.findByLoanAccountId(loanAccountId).stream().map(this::toNoteResponse).collect(Collectors.toList());
    }

    // ── TASK ──────────────────────────────────────────────────────────────────

    public TaskResponseDTO createTask(TaskRequestDTO dto) {
        log.info("Creating follow-up task for loanAccountId={} agentId={} type={}", dto.getLoanAccountId(), dto.getAgentId(), dto.getTaskType());
        validateLoanExists(dto.getLoanAccountId());
        if (dto.getAgentId() != null) validateAgentExists(dto.getAgentId());
        FollowUpTask task = new FollowUpTask();
        task.setLoanAccountId(dto.getLoanAccountId());
        task.setAgentId(dto.getAgentId());
        task.setDueDate(dto.getDueDate() != null ? LocalDate.parse(dto.getDueDate()) : null);
        task.setTaskType(dto.getTaskType() != null ? TaskType.valueOf(dto.getTaskType()) : null);
        task.setPriority(dto.getPriority());
        task.setStatus(TaskStatus.OPEN);
        FollowUpTask saved = taskRepo.save(task);
        log.info("Follow-up task created with id={}", saved.getTaskId());
        return toTaskResponse(saved);
    }

    public List<TaskResponseDTO> getTasksByAgent(Long agentId) {
        log.debug("Fetching tasks for agentId={}", agentId);
        return taskRepo.findByAgentId(agentId).stream().map(this::toTaskResponse).collect(Collectors.toList());
    }

    // ── MAPPERS ───────────────────────────────────────────────────────────────

    private CaseResponseDTO toCaseResponse(CollectionCase c) {
        return CaseResponseDTO.builder()
                .caseId(c.getCaseId())
                .loanAccountId(c.getLoanAccountId())
                .caseType(c.getCaseType() != null ? c.getCaseType().name() : null)
                .priority(c.getPriority() != null ? c.getPriority().name() : null)
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .openedDate(c.getOpenedDate() != null ? c.getOpenedDate().toString() : null)
                .build();
    }

    private NoteResponseDTO toNoteResponse(CaseNote n) {
        return NoteResponseDTO.builder()
                .noteId(n.getNoteId())
                .loanAccountId(n.getLoanAccountId())
                .agentId(n.getAgentId())
                .note(n.getNote())
                .noteType(n.getNoteType())
                .createdAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null)
                .build();
    }

    private TaskResponseDTO toTaskResponse(FollowUpTask t) {
        return TaskResponseDTO.builder()
                .taskId(t.getTaskId())
                .loanAccountId(t.getLoanAccountId())
                .agentId(t.getAgentId())
                .dueDate(t.getDueDate() != null ? t.getDueDate().toString() : null)
                .taskType(t.getTaskType() != null ? t.getTaskType().name() : null)
                .priority(t.getPriority())
                .status(t.getStatus() != null ? t.getStatus().name() : null)
                .build();
    }
}
