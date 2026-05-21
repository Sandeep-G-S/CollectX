package com.collectx.portfolio.feign.fallback;

import com.collectx.portfolio.feign.StrategyClient;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class StrategyClientFallback implements StrategyClient {

    @Override
    public String assignLoan(Map<String, String> request) {
        return "Strategy service unavailable — loan assignment will be retried";
    }
}
