package com.collectx.payment.feign;

import com.collectx.payment.feign.fallback.PortfolioClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "portfolio-service", fallback = PortfolioClientFallback.class)
public interface PortfolioClient {

    @PutMapping("/portfolio/loan/payment")
    String applyPayment(@RequestBody Map<String, Object> request);

    /**
     * Internal endpoint — no JWT required.
     * Returns true if a loan with the given ID exists in the portfolio DB.
     */
    @GetMapping("/portfolio/internal/loan/exists/{id}")
    boolean loanExists(@PathVariable("id") Long id);
}
