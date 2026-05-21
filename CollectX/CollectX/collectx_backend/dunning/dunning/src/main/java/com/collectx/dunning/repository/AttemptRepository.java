package com.collectx.dunning.repository;

import com.collectx.dunning.entity.ContactAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AttemptRepository extends JpaRepository<ContactAttempt, Long> {

    // Used for max-attempts-per-day check
    List<ContactAttempt> findByLoanAccountIdAndAttemptTimeBetween(
            Long loanId, LocalDateTime start, LocalDateTime end);

    // Alias used in orchestration + attempt service (same query, named consistently)
    @Query("SELECT a FROM ContactAttempt a WHERE a.loanAccountId = :loanId " +
           "AND a.attemptTime BETWEEN :from AND :to")
    List<ContactAttempt> findAttemptsInWindow(
            @Param("loanId") Long loanId,
            @Param("from")   LocalDateTime from,
            @Param("to")     LocalDateTime to);

    // Used for min-gap check — get the single most recent attempt for a loan
    List<ContactAttempt> findTop1ByLoanAccountIdOrderByAttemptTimeDesc(Long loanId);

    // Used for listing all attempts for a loan (newest first)
    List<ContactAttempt> findByLoanAccountIdOrderByAttemptTimeDesc(Long loanId);
}
