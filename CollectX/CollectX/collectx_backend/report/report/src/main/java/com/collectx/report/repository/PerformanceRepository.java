package com.collectx.report.repository;

import com.collectx.report.entity.AgentPerformance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PerformanceRepository extends JpaRepository<AgentPerformance, Long> {}