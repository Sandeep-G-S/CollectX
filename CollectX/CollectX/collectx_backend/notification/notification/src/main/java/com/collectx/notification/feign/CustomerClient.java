package com.collectx.notification.feign;

import com.collectx.notification.feign.fallback.CustomerClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "customer-service", fallback = CustomerClientFallback.class)
public interface CustomerClient {

    @GetMapping("/customer/{id}")
    Map<String, Object> getById(@PathVariable("id") Long id);
}
