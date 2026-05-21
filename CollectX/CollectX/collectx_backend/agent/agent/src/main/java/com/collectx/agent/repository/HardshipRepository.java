package com.collectx.agent.repository;

import com.collectx.agent.entity.HardshipFlag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HardshipRepository extends JpaRepository<HardshipFlag, Long> {
}