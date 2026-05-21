package com.collectx.legal.repository;

import com.collectx.legal.entity.Recovery;
import com.collectx.legal.enums.RecoveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecoveryRepository extends JpaRepository<Recovery, Long> {
    List<Recovery> findByLoanAccountId(Long loanAccountId);
    List<Recovery> findByStatus(RecoveryStatus status);
}
