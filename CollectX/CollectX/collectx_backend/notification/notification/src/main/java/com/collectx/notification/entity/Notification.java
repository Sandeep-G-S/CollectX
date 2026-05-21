package com.collectx.notification.entity;

import com.collectx.notification.enums.NotificationStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;

    private Long customerId;
    private Long loanAccountId;
    private String message;

    // SMS | EMAIL | PUSH | INAPP
    private String channel;

    // REMINDER | ALERT | PAYMENT | LEGAL | GENERAL | PTP | SYSTEM
    private String notificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private NotificationStatus status;

    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }
}
