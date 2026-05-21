package com.collectx.notification.dto;

import lombok.Data;

@Data
public class NotificationRequestDTO {
    private Long customerId;
    private Long loanAccountId;
    private String message;
    private String channel;           // SMS | EMAIL | PUSH | INAPP
    private String notificationType;  // REMINDER | ALERT | PAYMENT | LEGAL | GENERAL | PTP | SYSTEM
}
