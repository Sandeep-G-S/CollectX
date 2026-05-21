package com.collectx.portfolio.repository;

import com.collectx.portfolio.entity.RiskRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RiskRepository extends JpaRepository<RiskRef, Long> {
}
