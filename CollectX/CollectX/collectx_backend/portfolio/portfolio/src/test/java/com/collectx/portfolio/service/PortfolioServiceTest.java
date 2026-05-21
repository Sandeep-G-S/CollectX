package com.collectx.portfolio.service;

import com.collectx.portfolio.dto.LoanRequestDTO;
import com.collectx.portfolio.dto.LoanResponseDTO;
import com.collectx.portfolio.entity.LoanRef;
import com.collectx.portfolio.feign.CustomerClient;
import com.collectx.portfolio.feign.StrategyClient;
import com.collectx.portfolio.repository.LoanRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private CustomerClient customerClient;

    @Mock
    private StrategyClient strategyClient;

    @InjectMocks
    private PortfolioService portfolioService;

    private LoanRequestDTO buildDTO(int daysAgo) {
        LoanRequestDTO dto = new LoanRequestDTO();
        dto.setCustomerId(101L);
        dto.setProduct("HOME_LOAN");
        dto.setPrincipalOS(500000.0);
        dto.setInterestOS(20000.0);
        dto.setLastPaymentDate(LocalDate.now().minusDays(daysAgo).toString());
        dto.setRegion("NORTH");
        return dto;
    }

    private LoanRef savedLoan(Long id, Double principal, Double interest, LocalDate lastPayment) {
        LoanRef loan = new LoanRef();
        loan.setLoanAccountId(id);
        loan.setCustomerId(101L);
        loan.setPrincipalOS(principal);
        loan.setInterestOS(interest);
        loan.setLastPaymentDate(lastPayment);
        loan.setStatus("Delinquent");
        return loan;
    }

    @Test
    void createLoan_bucket0to30_whenDpdIs15() {
        LoanRequestDTO dto = buildDTO(15);
        when(customerClient.getById(101L)).thenReturn(Map.of("customerId", 101L));
        LoanRef saved = savedLoan(1L, 500000.0, 20000.0, LocalDate.now().minusDays(15));
        when(loanRepository.save(any())).thenReturn(saved);

        LoanResponseDTO result = portfolioService.createLoan(dto, "token");

        assertNotNull(result);
        verify(strategyClient).assignLoan(any());
    }

    @Test
    void createLoan_bucket31to60_whenDpdIs45() {
        LoanRequestDTO dto = buildDTO(45);
        when(customerClient.getById(101L)).thenReturn(Map.of("customerId", 101L));
        LoanRef saved = savedLoan(2L, 500000.0, 20000.0, LocalDate.now().minusDays(45));
        when(loanRepository.save(any())).thenReturn(saved);

        LoanResponseDTO result = portfolioService.createLoan(dto, "token");

        assertNotNull(result);
        verify(loanRepository).save(argThat(loan -> "31-60".equals(loan.getBucket())));
    }

    @Test
    void createLoan_bucket61to90_whenDpdIs75() {
        LoanRequestDTO dto = buildDTO(75);
        when(customerClient.getById(101L)).thenReturn(Map.of("customerId", 101L));
        LoanRef saved = savedLoan(3L, 500000.0, 20000.0, LocalDate.now().minusDays(75));
        when(loanRepository.save(any())).thenReturn(saved);

        portfolioService.createLoan(dto, "token");

        verify(loanRepository).save(argThat(loan -> "61-90".equals(loan.getBucket())));
    }

    @Test
    void createLoan_bucket90plus_whenDpdIs100() {
        LoanRequestDTO dto = buildDTO(100);
        when(customerClient.getById(101L)).thenReturn(Map.of("customerId", 101L));
        LoanRef saved = savedLoan(4L, 500000.0, 20000.0, LocalDate.now().minusDays(100));
        when(loanRepository.save(any())).thenReturn(saved);

        portfolioService.createLoan(dto, "token");

        verify(loanRepository).save(argThat(loan -> "90+".equals(loan.getBucket())));
    }

    @Test
    void createLoan_throwsException_whenCustomerNotFound() {
        LoanRequestDTO dto = buildDTO(30);
        when(customerClient.getById(101L)).thenReturn(Map.of());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> portfolioService.createLoan(dto, "token"));

        assertEquals("Customer not found with ID: 101", ex.getMessage());
        verify(loanRepository, never()).save(any());
    }

    @Test
    void createLoan_proceedsNormally_whenCustomerServiceFallback() {
        LoanRequestDTO dto = buildDTO(20);
        when(customerClient.getById(101L)).thenReturn(Map.of("_fallback", true));
        LoanRef saved = savedLoan(5L, 500000.0, 20000.0, LocalDate.now().minusDays(20));
        when(loanRepository.save(any())).thenReturn(saved);

        LoanResponseDTO result = portfolioService.createLoan(dto, "token");

        assertNotNull(result);
        verify(loanRepository).save(any());
    }

    @Test
    void getLoan_returnsDTO_whenLoanExists() {
        LoanRef loan = savedLoan(1L, 450000.0, 18000.0, LocalDate.now().minusDays(45));
        loan.setProduct("HOME_LOAN");
        loan.setRegion("NORTH");
        loan.setBucket("31-60");
        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));

        LoanResponseDTO result = portfolioService.getLoan(1L);

        assertNotNull(result);
        assertEquals(1L, result.getLoanAccountId());
        assertEquals(450000.0, result.getPrincipalOS());
        assertEquals("31-60", result.getBucket());
    }

    @Test
    void getLoan_throwsException_whenLoanNotFound() {
        when(loanRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> portfolioService.getLoan(999L));

        assertEquals("Loan not found", ex.getMessage());
    }

    @Test
    void getAllLoans_returnsMappedDTOList() {
        LoanRef loan1 = savedLoan(1L, 500000.0, 20000.0, LocalDate.now().minusDays(10));
        LoanRef loan2 = savedLoan(2L, 200000.0, 8000.0, LocalDate.now().minusDays(50));
        when(loanRepository.findAll()).thenReturn(List.of(loan1, loan2));

        List<LoanResponseDTO> result = portfolioService.getAllLoans();

        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getLoanAccountId());
        assertEquals(2L, result.get(1).getLoanAccountId());
    }

    @Test
    void loanExists_returnsTrue_whenLoanExists() {
        when(loanRepository.existsById(1L)).thenReturn(true);
        assertTrue(portfolioService.loanExists(1L));
    }

    @Test
    void loanExists_returnsFalse_whenLoanNotFound() {
        when(loanRepository.existsById(999L)).thenReturn(false);
        assertFalse(portfolioService.loanExists(999L));
    }

    @Test
    void applyPayment_deductsInterestFirst_thenPrincipal() {
        LoanRef loan = savedLoan(1L, 500000.0, 20000.0, LocalDate.now().minusDays(30));
        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));

        portfolioService.applyPayment(1L, 30000.0);

        verify(loanRepository).save(argThat(l ->
                l.getInterestOS() == 0.0 && l.getPrincipalOS() == 490000.0
        ));
    }

    @Test
    void applyPayment_setsStatusClosed_whenFullyPaid() {
        LoanRef loan = savedLoan(1L, 10000.0, 2000.0, LocalDate.now().minusDays(30));
        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));

        portfolioService.applyPayment(1L, 15000.0);

        verify(loanRepository).save(argThat(l ->
                l.getPrincipalOS() == 0.0
                && l.getInterestOS() == 0.0
                && "CLOSED".equals(l.getStatus())
                && l.getDpd() == 0
        ));
    }

    @Test
    void applyPayment_throwsException_whenLoanNotFound() {
        when(loanRepository.findById(anyLong())).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> portfolioService.applyPayment(999L, 5000.0));

        assertEquals("Loan not found", ex.getMessage());
        verify(loanRepository, never()).save(any());
    }
}
