package com.collectx.strategy.repository;

import com.collectx.strategy.entity.StrategyRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StrategyRepository extends JpaRepository<StrategyRule, Long> {
    List<StrategyRule> findByStatusOrderByPriorityAsc(String status);
}