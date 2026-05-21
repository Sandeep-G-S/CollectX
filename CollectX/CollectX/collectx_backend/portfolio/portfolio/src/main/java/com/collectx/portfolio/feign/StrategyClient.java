package com.collectx.portfolio.feign;

import com.collectx.portfolio.feign.fallback.StrategyClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "strategy-service", fallback = StrategyClientFallback.class)
public interface StrategyClient {

    @PostMapping("/strategy/assign")
    String assignLoan(@RequestBody Map<String, String> request);
}
