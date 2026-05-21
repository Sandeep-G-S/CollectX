package com.collectx.payment.repository;

import com.collectx.payment.entity.PaymentRef;
import com.collectx.payment.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<PaymentRef, Long> {

    List<PaymentRef> findByLoanAccountId(Long loanAccountId);

    /** Used by PTP auto-update: find verified payments for a given loan */
    List<PaymentRef> findByLoanAccountIdAndStatus(Long loanAccountId, PaymentStatus status);
}
