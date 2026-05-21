package com.collectx.portfolio.feign.fallback;

import com.collectx.portfolio.feign.CustomerClient;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CustomerClientFallback implements CustomerClient {

    @Override
    public Map<String, Object> getById(Long id) {
        return Map.of("customerId", id, "name", "Unknown", "_fallback", true);
    }
}
