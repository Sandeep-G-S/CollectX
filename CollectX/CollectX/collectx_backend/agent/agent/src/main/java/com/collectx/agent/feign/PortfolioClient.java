package com.collectx.agent.feign;

import com.collectx.agent.feign.fallback.PortfolioClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "portfolio-service", fallback = PortfolioClientFallback.class)
public interface PortfolioClient {

    /**
     * Internal endpoint — no JWT required.
     * Returns true if a loan with the given ID exists in the portfolio DB.
     */
    @GetMapping("/portfolio/internal/loan/exists/{id}")
    boolean loanExists(@PathVariable("id") Long id);
}
