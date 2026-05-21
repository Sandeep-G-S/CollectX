package com.collectx.dunning.feign;

import com.collectx.dunning.feign.fallback.PortfolioClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for the Portfolio service.
 * Used to validate that a loanAccountId exists before logging a dunning attempt.
 * Calls the internal (no-auth) endpoint added to portfolio-service.
 */
@FeignClient(name = "portfolio-service", fallback = PortfolioClientFallback.class)
public interface PortfolioClient {

    @GetMapping("/portfolio/internal/loan/exists/{id}")
    boolean loanExists(@PathVariable("id") Long id);
}
