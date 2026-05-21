package com.collectx.agent.feign.fallback;

import com.collectx.agent.feign.PaymentClient;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PaymentClientFallback implements PaymentClient {

    @Override
    public String createPTP(Map<String, Object> request) {
        return "Payment service unavailable — PTP creation will be retried";
    }
}
