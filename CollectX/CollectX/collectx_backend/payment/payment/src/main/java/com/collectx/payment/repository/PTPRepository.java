package com.collectx.payment.repository;

import com.collectx.payment.entity.PTP;
import com.collectx.payment.enums.PTPStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PTPRepository extends JpaRepository<PTP, Long> {

    List<PTP> findByLoanAccountId(Long loanId);

    /** Used by the auto-update scheduler: all OPEN PTPs */
    List<PTP> findByStatus(PTPStatus status);

    /** Overdue OPEN PTPs: promisedDate is strictly before today */
    List<PTP> findByStatusAndPromisedDateBefore(PTPStatus status, LocalDate date);
}
