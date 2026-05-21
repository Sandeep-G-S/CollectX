package com.collectx.field.feign.fallback;

import com.collectx.field.feign.PortfolioClient;
import org.springframework.stereotype.Component;

/**
 * Fallback for PortfolioClient — triggered when portfolio-service is unreachable.
 * Returns true to avoid blocking operations during transient outages.
 */
@Component
public class PortfolioClientFallback implements PortfolioClient {

    @Override
    public boolean loanExists(Long id) {
        // Fail open: allow the request if portfolio-service is down
        return true;
    }
}
