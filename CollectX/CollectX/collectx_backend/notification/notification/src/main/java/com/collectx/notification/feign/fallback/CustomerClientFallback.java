package com.collectx.notification.feign.fallback;

import com.collectx.notification.feign.CustomerClient;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CustomerClientFallback implements CustomerClient {

    @Override
    public Map<String, Object> getById(Long id) {
        // If customer-service is down, allow notification but skip consent check
        return Map.of(
                "customerId", id,
                "consentSms", true,
                "consentEmail", true,
                "consentCall", true,
                "_fallback", true
        );
    }
}
