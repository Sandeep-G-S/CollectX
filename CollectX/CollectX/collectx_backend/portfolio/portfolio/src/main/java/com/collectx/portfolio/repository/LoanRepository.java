package com.collectx.portfolio.repository;

import com.collectx.portfolio.entity.LoanRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoanRepository extends JpaRepository<LoanRef, Long> {
}