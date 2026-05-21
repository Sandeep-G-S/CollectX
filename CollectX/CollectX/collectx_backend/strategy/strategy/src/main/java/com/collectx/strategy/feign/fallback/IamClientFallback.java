package com.collectx.strategy.feign.fallback;

import com.collectx.strategy.feign.IamClient;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Fallback for IamClient — if IAM service is unavailable, returns an empty list
 * so StrategyService falls back to agent ID 1.
 */
@Component
public class IamClientFallback implements IamClient {

    @Override
    public List<Long> getAgentIds() {
        return List.of();
    }
}
