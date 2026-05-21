package com.collectx.strategy.service;

import com.collectx.strategy.dto.AssignmentResponseDTO;
import com.collectx.strategy.dto.RuleRequestDTO;
import com.collectx.strategy.dto.RuleResponseDTO;
import com.collectx.strategy.entity.Assignment;
import com.collectx.strategy.entity.StrategyRule;
import com.collectx.strategy.feign.IamClient;
import com.collectx.strategy.feign.NotificationClient;
import com.collectx.strategy.repository.AssignmentRepository;
import com.collectx.strategy.repository.StrategyRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StrategyService {

    private static final Logger log = LoggerFactory.getLogger(StrategyService.class);

    private final StrategyRepository strategyRepo;
    private final AssignmentRepository assignmentRepo;

    @Autowired
    private NotificationClient notificationClient;

    @Autowired
    private IamClient iamClient;

    /** Shared counter for round-robin agent assignment across all loans. */
    private final AtomicInteger roundRobinCounter = new AtomicInteger(0);

    // ── ASSIGN LOAN ───────────────────────────────────────────────────────────

    public Assignment assignLoan(Long loanAccountId,
                                 String bucket,
                                 String riskBand,
                                 String token) {

        log.info("Assigning loan={} bucket={} riskBand={}", loanAccountId, bucket, riskBand);

        List<StrategyRule> rules = strategyRepo.findByStatusOrderByPriorityAsc("ACTIVE");

        Assignment assignment = new Assignment();
        assignment.setLoanAccountId(loanAccountId);
        assignment.setQueueId(1L);
        assignment.setAssignedDate(LocalDate.now());
        assignment.setStatus("OPEN");

        // Try to find a matching strategy rule
        boolean ruleMatched = false;
        for (StrategyRule rule : rules) {
            if (rule.getBucket().equals(bucket) && rule.getRiskBand().equals(riskBand)) {
                assignment.setAgentId(assignAgent(rule));
                ruleMatched = true;
                log.info("Matched strategy rule id={} for loan={}", rule.getRuleId(), loanAccountId);
                break;
            }
        }

        // If no matching rule found, still use round-robin from real agents
        if (!ruleMatched) {
            assignment.setAgentId(pickNextAgent());
            log.warn("No matching strategy rule for bucket={} riskBand={} — using round-robin fallback", bucket, riskBand);
        }

        Assignment saved = assignmentRepo.save(assignment);
        log.info("Assignment created with id={} agentId={}", saved.getAssignmentId(), saved.getAgentId());

        // Send notification to the assigned agent
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("customerId", 0);
            body.put("loanAccountId", loanAccountId);
            body.put("message", "New loan #L" + loanAccountId + " assigned to you (Bucket: " + bucket + ")");
            body.put("channel", "INAPP");
            body.put("notificationType", "SYSTEM");
            notificationClient.sendNotification(body);
        } catch (Exception e) {
            log.warn("Notification failed for loan assignment loan={} — {}", loanAccountId, e.getMessage());
        }

        return saved;
    }

    // ── CREATE RULE ───────────────────────────────────────────────────────────

    public RuleResponseDTO createRule(RuleRequestDTO dto) {
        log.info("Creating strategy rule name={} bucket={} riskBand={} priority={}", dto.getName(), dto.getBucket(), dto.getRiskBand(), dto.getPriority());

        StrategyRule rule = new StrategyRule();
        // ruleId intentionally NOT set — @GeneratedValue(IDENTITY) handles it
        rule.setName(dto.getName());
        rule.setBucket(dto.getBucket());
        rule.setRiskBand(dto.getRiskBand());
        rule.setPriority(dto.getPriority());
        rule.setExpression(dto.getExpression());
        rule.setStatus("ACTIVE");

        StrategyRule saved = strategyRepo.save(rule);
        log.info("Strategy rule created with id={}", saved.getRuleId());
        return toRuleResponse(saved);
    }

    // ── GET ALL ───────────────────────────────────────────────────────────────

    public List<AssignmentResponseDTO> getAssignments() {
        log.debug("Fetching all assignments");
        return assignmentRepo.findAll().stream().map(this::toAssignmentResponse).collect(Collectors.toList());
    }

    public List<RuleResponseDTO> getRules() {
        log.debug("Fetching all strategy rules");
        return strategyRepo.findAll().stream().map(this::toRuleResponse).collect(Collectors.toList());
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /**
     * Picks the next agent using round-robin from real AGENT users in IAM.
     * Falls back to agent ID 1 if IAM is unreachable or has no agents.
     */
    private Long pickNextAgent() {
        try {
            List<Long> agents = iamClient.getAgentIds();
            if (agents != null && !agents.isEmpty()) {
                int idx = Math.abs(roundRobinCounter.getAndIncrement() % agents.size());
                Long picked = agents.get(idx);
                log.info("Round-robin agent assignment: picked agentId={} (index={} of {})", picked, idx, agents.size());
                return picked;
            }
        } catch (Exception e) {
            log.warn("Could not fetch agents from IAM — defaulting to agent 1. Reason: {}", e.getMessage());
        }
        return 1L;
    }

    private Long assignAgent(StrategyRule rule) {
        return pickNextAgent();
    }

    // ── MAPPERS ───────────────────────────────────────────────────────────────

    private AssignmentResponseDTO toAssignmentResponse(Assignment a) {
        return AssignmentResponseDTO.builder()
                .assignmentId(a.getAssignmentId())
                .loanAccountId(a.getLoanAccountId())
                .agentId(a.getAgentId())
                .queueId(a.getQueueId())
                .assignedDate(a.getAssignedDate() != null ? a.getAssignedDate().toString() : null)
                .status(a.getStatus())
                .build();
    }

    private RuleResponseDTO toRuleResponse(StrategyRule r) {
        return RuleResponseDTO.builder()
                .ruleId(r.getRuleId())
                .name(r.getName())
                .bucket(r.getBucket())
                .riskBand(r.getRiskBand())
                .priority(r.getPriority())
                .status(r.getStatus())
                .build();
    }
}
