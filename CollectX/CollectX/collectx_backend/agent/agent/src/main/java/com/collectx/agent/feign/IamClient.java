package com.collectx.agent.feign;

import com.collectx.agent.feign.fallback.IamClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "iam-service", fallback = IamClientFallback.class)
public interface IamClient {

    /**
     * Internal endpoint — no JWT required.
     * Returns true if a user with the given ID exists and has the AGENT role.
     */
    @GetMapping("/auth/internal/agent/exists/{id}")
    boolean agentExists(@PathVariable("id") Long id);
}
