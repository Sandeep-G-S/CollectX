package com.collectx.strategy.feign;

import com.collectx.strategy.feign.fallback.IamClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

/**
 * Feign client for the IAM service.
 * Used to fetch the list of active AGENT user IDs for round-robin assignment.
 */
@FeignClient(name = "iam-service", fallback = IamClientFallback.class)
public interface IamClient {

    @GetMapping("/auth/agents")
    List<Long> getAgentIds();
}
