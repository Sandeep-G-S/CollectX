package com.collectx.legal.repository;

import com.collectx.legal.entity.WriteOff;
import com.collectx.legal.enums.WriteOffStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WriteOffRepository extends JpaRepository<WriteOff, Long> {
    List<WriteOff> findByLoanAccountId(Long loanAccountId);
    List<WriteOff> findByStatus(WriteOffStatus status);
}
