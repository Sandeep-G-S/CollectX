package com.collectx.agent.feign.fallback;

import com.collectx.agent.feign.IamClient;
import org.springframework.stereotype.Component;

/**
 * Fallback for IamClient — triggered when iam-service is unreachable.
 * Returns true to avoid blocking operations during transient outages.
 */
@Component
public class IamClientFallback implements IamClient {

    @Override
    public boolean agentExists(Long id) {
        // Fail open: allow the request if iam-service is down
        return true;
    }
}
