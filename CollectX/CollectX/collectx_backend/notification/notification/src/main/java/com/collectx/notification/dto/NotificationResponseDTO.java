package com.collectx.notification.dto;

import lombok.Data;

@Data
public class NotificationResponseDTO {
    private Long notificationId;
    private Long customerId;
    private Long loanAccountId;
    private String message;
    private String channel;
    private String notificationType;
    private String status;       // UNREAD | READ | DISMISSED
    private String sentAt;       // ISO datetime string
}
