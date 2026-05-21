package com.collectx.dunning.feign.fallback;

import com.collectx.dunning.feign.PortfolioClient;
import org.springframework.stereotype.Component;

/**
 * Fallback for PortfolioClient — if portfolio-service is unreachable,
 * returns true so dunning does NOT block the attempt due to a service outage.
 */
@Component
public class PortfolioClientFallback implements PortfolioClient {

    @Override
    public boolean loanExists(Long id) {
        // Portfolio service unreachable — skip validation, allow attempt to proceed
        return true;
    }
}
