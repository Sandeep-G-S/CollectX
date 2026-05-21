package com.collectx.field.service;

import com.collectx.field.dto.*;
import com.collectx.field.entity.AgencyPlacement;
import com.collectx.field.entity.FieldVisit;
import com.collectx.field.entity.Repossession;
import com.collectx.field.enums.PlacementStatus;
import com.collectx.field.enums.RepossessionStatus;
import com.collectx.field.enums.VisitOutcome;
import com.collectx.field.enums.VisitType;
import com.collectx.field.feign.PortfolioClient;
import com.collectx.field.repository.PlacementRepository;
import com.collectx.field.repository.RepoRepository;
import com.collectx.field.repository.VisitRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FieldService {

    private static final Logger log = LoggerFactory.getLogger(FieldService.class);

    private final VisitRepository visitRepo;
    private final RepoRepository repoRepo;
    private final PlacementRepository placementRepo;

    @Autowired(required = false)
    private PortfolioClient portfolioClient;

    // ── VALIDATION HELPERS ────────────────────────────────────────────────────

    private void validateLoanExists(Long loanAccountId) {
        if (portfolioClient != null) {
            try {
                if (!portfolioClient.loanExists(loanAccountId)) {
                    throw new RuntimeException("Loan account ID " + loanAccountId + " does not exist in portfolio");
                }
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Could not validate loan={} — portfolio service unreachable: {}", loanAccountId, e.getMessage());
            }
        }
    }

    // ── CREATE FIELD VISIT ────────────────────────────────────────────────────

    public VisitResponseDTO scheduleVisit(VisitRequestDTO dto) {
        log.info("Scheduling field visit for loan={} agent={} customer={}", dto.getLoanAccountId(), dto.getAgentId(), dto.getCustomerId());
        validateLoanExists(dto.getLoanAccountId());

        FieldVisit visit = new FieldVisit();
        visit.setLoanAccountId(dto.getLoanAccountId());
        visit.setAgentId(dto.getAgentId());
        visit.setCustomerId(dto.getCustomerId());
        visit.setVisitDate(dto.getVisitDate() != null ? LocalDate.parse(dto.getVisitDate()) : null);
        visit.setAddress(dto.getAddress());
        visit.setOutcome(dto.getOutcome() != null && !dto.getOutcome().isBlank()
                ? VisitOutcome.valueOf(dto.getOutcome()) : null);
        visit.setVisitType(dto.getVisitType() != null
                ? VisitType.valueOf(dto.getVisitType()) : VisitType.COMPLETED);
        visit.setNotes(dto.getNotes());

        FieldVisit saved = visitRepo.save(visit);
        log.info("Field visit created with id={}", saved.getVisitId());
        return toVisitResponse(saved);
    }

    // ── CREATE REPOSSESSION ───────────────────────────────────────────────────

    public RepossessionResponseDTO createRepossession(RepossessionRequestDTO dto) {
        log.info("Recording repossession for loan={} agent={}", dto.getLoanAccountId(), dto.getAgentId());
        validateLoanExists(dto.getLoanAccountId());

        Repossession repo = new Repossession();
        repo.setLoanAccountId(dto.getLoanAccountId());
        repo.setAgentId(dto.getAgentId());
        repo.setAssetDescription(dto.getAssetDescription());
        repo.setEstimatedValue(dto.getEstimatedValue());
        repo.setRepossessedDate(dto.getRepossessedDate() != null ? LocalDate.parse(dto.getRepossessedDate()) : null);
        repo.setStatus(RepossessionStatus.INITIATED);

        Repossession saved = repoRepo.save(repo);
        log.info("Repossession recorded with id={}", saved.getRepossessionId());
        return toRepoResponse(saved);
    }

    // ── CREATE AGENCY PLACEMENT ───────────────────────────────────────────────

    public AgencyPlacementResponseDTO assignAgency(AgencyPlacementRequestDTO dto) {
        log.info("Creating agency placement for loan={} agency={}", dto.getLoanAccountId(), dto.getAgencyId());
        validateLoanExists(dto.getLoanAccountId());

        AgencyPlacement placement = new AgencyPlacement();
        placement.setLoanAccountId(dto.getLoanAccountId());
        placement.setAgencyId(dto.getAgencyId());
        placement.setAgencyName(dto.getAgencyName());
        placement.setPlacementDate(dto.getPlacementDate() != null ? LocalDate.parse(dto.getPlacementDate()) : null);
        placement.setOutstandingAmount(dto.getOutstandingAmount());
        placement.setStatus(PlacementStatus.ACTIVE);

        AgencyPlacement saved = placementRepo.save(placement);
        log.info("Agency placement created with id={}", saved.getPlacementId());
        return toPlacementResponse(saved);
    }

    // ── GET ALL ───────────────────────────────────────────────────────────────

    public List<VisitResponseDTO> getAllVisits() {
        log.debug("Fetching all field visits");
        return visitRepo.findAll().stream().map(this::toVisitResponse).collect(Collectors.toList());
    }

    public List<RepossessionResponseDTO> getAllRepossessions() {
        log.debug("Fetching all repossessions");
        return repoRepo.findAll().stream().map(this::toRepoResponse).collect(Collectors.toList());
    }

    public List<AgencyPlacementResponseDTO> getAllPlacements() {
        log.debug("Fetching all agency placements");
        return placementRepo.findAll().stream().map(this::toPlacementResponse).collect(Collectors.toList());
    }

    // ── MAPPERS ───────────────────────────────────────────────────────────────

    private VisitResponseDTO toVisitResponse(FieldVisit v) {
        return VisitResponseDTO.builder()
                .visitId(v.getVisitId())
                .loanAccountId(v.getLoanAccountId())
                .agentId(v.getAgentId())
                .customerId(v.getCustomerId())
                .visitDate(v.getVisitDate() != null ? v.getVisitDate().toString() : null)
                .address(v.getAddress())
                .outcome(v.getOutcome() != null ? v.getOutcome().name() : null)
                .notes(v.getNotes())
                .visitType(v.getVisitType() != null ? v.getVisitType().name() : "COMPLETED")
                .build();
    }

    private RepossessionResponseDTO toRepoResponse(Repossession r) {
        return RepossessionResponseDTO.builder()
                .repossessionId(r.getRepossessionId())
                .loanAccountId(r.getLoanAccountId())
                .agentId(r.getAgentId())
                .assetDescription(r.getAssetDescription())
                .estimatedValue(r.getEstimatedValue())
                .repossessedDate(r.getRepossessedDate() != null ? r.getRepossessedDate().toString() : null)
                .status(r.getStatus() != null ? r.getStatus().name() : null)
                .build();
    }

    private AgencyPlacementResponseDTO toPlacementResponse(AgencyPlacement p) {
        return AgencyPlacementResponseDTO.builder()
                .placementId(p.getPlacementId())
                .loanAccountId(p.getLoanAccountId())
                .agencyId(p.getAgencyId())
                .agencyName(p.getAgencyName())
                .placementDate(p.getPlacementDate() != null ? p.getPlacementDate().toString() : null)
                .outstandingAmount(p.getOutstandingAmount())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .build();
    }
}
