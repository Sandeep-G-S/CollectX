package com.collectx.payment.feign.fallback;

import com.collectx.payment.feign.PortfolioClient;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PortfolioClientFallback implements PortfolioClient {

    @Override
    public String applyPayment(Map<String, Object> request) {
        return "Portfolio service unavailable — balance update will be retried";
    }

    @Override
    public boolean loanExists(Long id) {
        // Fail open: allow the request if portfolio-service is down
        return true;
    }
}
