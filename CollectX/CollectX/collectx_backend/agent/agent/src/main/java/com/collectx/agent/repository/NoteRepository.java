package com.collectx.agent.repository;

import com.collectx.agent.entity.CaseNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<CaseNote, Long> {
    List<CaseNote> findByLoanAccountId(Long loanAccountId);
}
