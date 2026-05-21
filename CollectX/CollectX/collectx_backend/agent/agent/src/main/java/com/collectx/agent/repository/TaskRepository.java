package com.collectx.agent.repository;

import com.collectx.agent.entity.FollowUpTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<FollowUpTask, Long> {
    List<FollowUpTask> findByAgentId(Long agentId);
}
