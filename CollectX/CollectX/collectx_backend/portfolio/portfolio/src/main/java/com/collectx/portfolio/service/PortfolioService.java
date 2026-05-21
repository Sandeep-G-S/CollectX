package com.collectx.portfolio.service;

import com.collectx.portfolio.dto.LoanRequestDTO;
import com.collectx.portfolio.dto.LoanResponseDTO;
import com.collectx.portfolio.entity.LoanRef;
import com.collectx.portfolio.feign.CustomerClient;
import com.collectx.portfolio.feign.StrategyClient;
import com.collectx.portfolio.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private static final Logger log = LoggerFactory.getLogger(PortfolioService.class);

    private final LoanRepository loanRepository;
    private final CustomerClient customerClient;
    private final StrategyClient strategyClient;


    private LoanRef toEntity(LoanRequestDTO dto) {
        LoanRef loan = new LoanRef();
        loan.setCustomerId(dto.getCustomerId());
        loan.setProduct(dto.getProduct());
        loan.setPrincipalOS(dto.getPrincipalOS());
        loan.setInterestOS(dto.getInterestOS() != null ? dto.getInterestOS() : 0.0);
        loan.setLastPaymentDate(LocalDate.parse(dto.getLastPaymentDate()));
        loan.setRegion(dto.getRegion());
        return loan;
    }

    private LoanResponseDTO toDTO(LoanRef loan) {
        LoanResponseDTO dto = new LoanResponseDTO();
        dto.setLoanAccountId(loan.getLoanAccountId());
        dto.setCustomerId(loan.getCustomerId());
        dto.setProduct(loan.getProduct());
        dto.setPrincipalOS(loan.getPrincipalOS());
        dto.setInterestOS(loan.getInterestOS());
        dto.setDpd(loan.getDpd());
        dto.setBucket(loan.getBucket());
        dto.setLastPaymentDate(loan.getLastPaymentDate() != null
                ? loan.getLastPaymentDate().toString() : null);
        dto.setRegion(loan.getRegion());
        dto.setStatus(loan.getStatus());
        return dto;
    }

    public LoanResponseDTO createLoan(LoanRequestDTO dto, String token) {
        log.info("Creating loan for customerId={} product={}", dto.getCustomerId(), dto.getProduct());
        LoanRef loan = toEntity(dto);

        if (loan.getCustomerId() != null) {
            Map<String, Object> customer = customerClient.getById(loan.getCustomerId());
            boolean isFallback = Boolean.TRUE.equals(customer.get("_fallback"));
            if (!isFallback && customer.get("customerId") == null) {
                throw new RuntimeException("Customer not found with ID: " + loan.getCustomerId());
            }
        }

        long dpd = ChronoUnit.DAYS.between(loan.getLastPaymentDate(), LocalDate.now());
        loan.setDpd((int) dpd);

        if      (dpd <= 30) loan.setBucket("0-30");
        else if (dpd <= 60) loan.setBucket("31-60");
        else if (dpd <= 90) loan.setBucket("61-90");
        else                 loan.setBucket("90+");

        loan.setStatus(dpd > 0 ? "Delinquent" : "Current");

        LoanRef savedLoan = loanRepository.save(loan);
        log.info("Loan created loanAccountId={} dpd={} bucket={}", savedLoan.getLoanAccountId(), savedLoan.getDpd(), savedLoan.getBucket());

        Map<String, String> body = new HashMap<>();
        body.put("loanAccountId", savedLoan.getLoanAccountId().toString());
        body.put("bucket", savedLoan.getBucket());
        body.put("riskBand", "HIGH");
        strategyClient.assignLoan(body);

        return toDTO(savedLoan);
    }

    public List<LoanResponseDTO> getAllLoans() {
        return loanRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public LoanResponseDTO getLoan(Long id) {
        LoanRef loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
        return toDTO(loan);
    }

    public boolean loanExists(Long id) {
        return loanRepository.existsById(id);
    }

    public void applyPayment(Long loanId, Double amount) {
        log.info("Applying payment loanId={} amount={}", loanId, amount);
        LoanRef loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        double remaining = amount;

        if (loan.getInterestOS() != null && loan.getInterestOS() > 0) {
            if (remaining >= loan.getInterestOS()) {
                remaining -= loan.getInterestOS();
                loan.setInterestOS(0.0);
            } else {
                loan.setInterestOS(loan.getInterestOS() - remaining);
                remaining = 0;
            }
        }

        if (remaining > 0 && loan.getPrincipalOS() != null && loan.getPrincipalOS() > 0) {
            if (remaining >= loan.getPrincipalOS()) {
                loan.setPrincipalOS(0.0);
            } else {
                loan.setPrincipalOS(loan.getPrincipalOS() - remaining);
            }
        }

        if (loan.getPrincipalOS() == 0 && loan.getInterestOS() == 0) {
            loan.setStatus("CLOSED");
            loan.setDpd(0);
            loan.setBucket("0-30");
        } else {
            long dpd = ChronoUnit.DAYS.between(loan.getLastPaymentDate(), LocalDate.now());
            loan.setDpd((int) dpd);
            if      (dpd <= 30) loan.setBucket("0-30");
            else if (dpd <= 60) loan.setBucket("31-60");
            else if (dpd <= 90) loan.setBucket("61-90");
            else                 loan.setBucket("90+");
        }

        loanRepository.save(loan);
        log.info("Payment applied loanId={} newPrincipalOS={} newInterestOS={} newStatus={}", loanId, loan.getPrincipalOS(), loan.getInterestOS(), loan.getStatus());
    }
}
