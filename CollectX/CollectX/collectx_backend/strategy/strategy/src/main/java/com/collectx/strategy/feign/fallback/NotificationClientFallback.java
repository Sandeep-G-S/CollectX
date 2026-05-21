package com.collectx.strategy.feign.fallback;

import com.collectx.strategy.feign.NotificationClient;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class NotificationClientFallback implements NotificationClient {

    @Override
    public String sendNotification(Map<String, Object> request) {
        return "Notification service unavailable — agent alert skipped";
    }
}
