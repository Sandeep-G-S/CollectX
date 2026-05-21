package com.collectx.payment.feign.fallback;

import com.collectx.payment.feign.ReportingClient;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ReportingClientFallback implements ReportingClient {

    @Override
    public String sendPerformance(Map<String, Object> request) {
        return "Reporting service unavailable — KPI update skipped";
    }
}
