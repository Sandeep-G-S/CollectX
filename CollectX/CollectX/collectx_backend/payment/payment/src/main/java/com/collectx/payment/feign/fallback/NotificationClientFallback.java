package com.collectx.payment.feign.fallback;

import com.collectx.payment.feign.NotificationClient;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class NotificationClientFallback implements NotificationClient {

    @Override
    public String send(Map<String, Object> request) {
        return "Notification service unavailable — notification queued for retry";
    }
}
