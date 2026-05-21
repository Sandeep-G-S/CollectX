package com.collectx.payment.feign;

import com.collectx.payment.feign.fallback.ReportingClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "reporting-service", fallback = ReportingClientFallback.class)
public interface ReportingClient {

    @PostMapping("/report/performance")
    String sendPerformance(@RequestBody Map<String, Object> request);
}
