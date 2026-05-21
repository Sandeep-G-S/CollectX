package com.collectx.agent.repository;

import com.collectx.agent.entity.CollectionCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseRepository extends JpaRepository<CollectionCase, Long> {
    List<CollectionCase> findByLoanAccountId(Long loanId);
}