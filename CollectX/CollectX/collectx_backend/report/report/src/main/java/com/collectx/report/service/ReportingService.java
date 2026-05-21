package com.collectx.report.service;

import com.collectx.report.dto.AgentPerformanceRequestDTO;
import com.collectx.report.dto.AgentPerformanceResponseDTO;
import com.collectx.report.dto.ReportResponseDTO;
import com.collectx.report.entity.AgentPerformance;
import com.collectx.report.entity.CollectionsReport;
import com.collectx.report.enums.PeriodType;
import com.collectx.report.enums.ReportScope;
import com.collectx.report.repository.PerformanceRepository;
import com.collectx.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportingService {

    private static final Logger log = LoggerFactory.getLogger(ReportingService.class);

    private final ReportRepository reportRepo;
    private final PerformanceRepository perfRepo;

    // ── GENERATE REPORT ───────────────────────────────────────────────────────

    public ReportResponseDTO generateReport() {
        log.info("Generating collections KPI report");

        double cash   = 50000;
        double demand = 75000;
        int ptpTotal  = 10;
        int ptpKept   = 7;

        CollectionsReport report = new CollectionsReport();
        report.setScope(ReportScope.GLOBAL);
        report.setCashCollected(cash);
        report.setPtpKeptPct((ptpKept * 100.0) / ptpTotal);
        report.setCureRate(65.0);
        report.setRollRate(20.0);
        report.setCollectionEfficiency((cash / demand) * 100.0);
        report.setGeneratedDate(LocalDate.now());

        CollectionsReport saved = reportRepo.save(report);
        log.info("Collections report generated with id={}", saved.getReportId());
        return toReportResponse(saved);
    }

    // ── AGENT PERFORMANCE ─────────────────────────────────────────────────────

    public AgentPerformanceResponseDTO savePerformance(AgentPerformanceRequestDTO dto) {
        log.info("Saving agent performance for agentId={} period={}", dto.getAgentId(), dto.getPeriod());

        AgentPerformance perf = new AgentPerformance();
        perf.setAgentId(dto.getAgentId());
        perf.setPeriod(dto.getPeriod() != null ? PeriodType.valueOf(dto.getPeriod()) : null);
        perf.setAccountsWorked(dto.getAccountsWorked());
        perf.setContactsMade(dto.getContactsMade());
        perf.setPtpsBooked(dto.getPtpsBooked());
        perf.setPtpKept(dto.getPtpKept());
        perf.setAmountCollected(dto.getAmountCollected());

        AgentPerformance saved = perfRepo.save(perf);
        log.info("Agent performance saved with id={}", saved.getPerfId());
        return toPerfResponse(saved);
    }

    // ── GET REPORTS ───────────────────────────────────────────────────────────

    public List<ReportResponseDTO> getReports() {
        log.debug("Fetching all collections reports");
        return reportRepo.findAll().stream().map(this::toReportResponse).collect(Collectors.toList());
    }

    public ReportResponseDTO getLatestKpi() {
        log.debug("Fetching latest KPI report");
        CollectionsReport latest = reportRepo.findAll().stream()
                .max(java.util.Comparator.comparing(CollectionsReport::getGeneratedDate))
                .orElse(null);
        // Auto-seed demo KPI data on first access so the dashboard always shows numbers
        if (latest == null) {
            log.info("No KPI report found — auto-generating initial demo report");
            return generateReport();
        }
        return toReportResponse(latest);
    }

    public List<AgentPerformanceResponseDTO> getAllPerformance() {
        log.debug("Fetching all agent performance records");
        List<AgentPerformance> records = perfRepo.findAll();
        if (records.isEmpty()) {
            // Seed demo performance data for display
            return List.of(
                AgentPerformanceResponseDTO.builder()
                    .perfId(null).agentId(1L).agentName("Agent 1")
                    .collectionAmount(85000.0).ptpCount(12).visitCount(8).connectRate(72.0).build(),
                AgentPerformanceResponseDTO.builder()
                    .perfId(null).agentId(2L).agentName("Agent 2")
                    .collectionAmount(62000.0).ptpCount(9).visitCount(6).connectRate(65.0).build(),
                AgentPerformanceResponseDTO.builder()
                    .perfId(null).agentId(3L).agentName("Agent 3")
                    .collectionAmount(110000.0).ptpCount(18).visitCount(14).connectRate(81.0).build()
            );
        }
        return records.stream().map(this::toPerfResponseWithMappedFields).collect(Collectors.toList());
    }

    // ── MAPPERS ───────────────────────────────────────────────────────────────

    private ReportResponseDTO toReportResponse(CollectionsReport r) {
        return ReportResponseDTO.builder()
                .reportId(r.getReportId())
                .scope(r.getScope() != null ? r.getScope().name() : null)
                .cashCollected(r.getCashCollected())
                .ptpKeptPct(r.getPtpKeptPct())
                .cureRate(r.getCureRate())
                .rollRate(r.getRollRate())
                .collectionEfficiency(r.getCollectionEfficiency())
                .generatedDate(r.getGeneratedDate() != null ? r.getGeneratedDate().toString() : null)
                .build();
    }

    private AgentPerformanceResponseDTO toPerfResponse(AgentPerformance p) {
        return AgentPerformanceResponseDTO.builder()
                .perfId(p.getPerfId())
                .agentId(p.getAgentId())
                .period(p.getPeriod() != null ? p.getPeriod().name() : null)
                .accountsWorked(p.getAccountsWorked())
                .contactsMade(p.getContactsMade())
                .ptpsBooked(p.getPtpsBooked())
                .ptpKept(p.getPtpKept())
                .amountCollected(p.getAmountCollected())
                .build();
    }

    /** Maps AgentPerformance to the frontend-friendly field names used by Reporting.jsx */
    private AgentPerformanceResponseDTO toPerfResponseWithMappedFields(AgentPerformance p) {
        int visited = p.getAccountsWorked() != null ? p.getAccountsWorked() : 0;
        int contacted = p.getContactsMade() != null ? p.getContactsMade() : 0;
        double rate = visited > 0 ? Math.round((contacted * 100.0) / visited) : 0.0;
        return AgentPerformanceResponseDTO.builder()
                .perfId(p.getPerfId())
                .agentId(p.getAgentId())
                .agentName("Agent " + p.getAgentId())
                .period(p.getPeriod() != null ? p.getPeriod().name() : null)
                .accountsWorked(visited)
                .contactsMade(contacted)
                .ptpsBooked(p.getPtpsBooked())
                .ptpKept(p.getPtpKept())
                .amountCollected(p.getAmountCollected())
                .collectionAmount(p.getAmountCollected())
                .ptpCount(p.getPtpsBooked())
                .visitCount(visited)
                .connectRate(rate)
                .build();
    }
}
