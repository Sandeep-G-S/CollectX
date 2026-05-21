package com.collectx.notification.service;

import com.collectx.notification.dto.NotificationRequestDTO;
import com.collectx.notification.dto.NotificationResponseDTO;
import com.collectx.notification.entity.Notification;
import com.collectx.notification.enums.NotificationStatus;
import com.collectx.notification.feign.CustomerClient;
import com.collectx.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repo;
    private final CustomerClient customerClient;

    // ── DTO → Entity ──────────────────────────────────────────────────────────
    private Notification toEntity(NotificationRequestDTO dto) {
        Notification n = new Notification();
        n.setCustomerId(dto.getCustomerId());
        n.setLoanAccountId(dto.getLoanAccountId());
        n.setMessage(dto.getMessage());
        n.setChannel(dto.getChannel());
        n.setNotificationType(dto.getNotificationType());
        return n;
    }

    // ── Entity → DTO ──────────────────────────────────────────────────────────
    private NotificationResponseDTO toDTO(Notification n) {
        NotificationResponseDTO dto = new NotificationResponseDTO();
        dto.setNotificationId(n.getNotificationId());
        dto.setCustomerId(n.getCustomerId());
        dto.setLoanAccountId(n.getLoanAccountId());
        dto.setMessage(n.getMessage());
        dto.setChannel(n.getChannel());
        dto.setNotificationType(n.getNotificationType());
        dto.setStatus(n.getStatus() != null ? n.getStatus().name() : null);
        dto.setSentAt(n.getSentAt() != null ? n.getSentAt().toString() : null);
        return dto;
    }

    // ─────────────────────────────────────────────────────────────────────────

    public NotificationResponseDTO create(NotificationRequestDTO dto) {
        // Check customer consent before sending
        if (dto.getCustomerId() != null) {
            try {
                Map<String, Object> customer = customerClient.getById(dto.getCustomerId());
                boolean isFallback = Boolean.TRUE.equals(customer.get("_fallback"));

                if (!isFallback) {
                    String channel = dto.getChannel();
                    if ("SMS".equalsIgnoreCase(channel) && Boolean.FALSE.equals(customer.get("consentSms"))) {
                        throw new RuntimeException("Customer has opted out of SMS notifications");
                    }
                    if ("EMAIL".equalsIgnoreCase(channel) && Boolean.FALSE.equals(customer.get("consentEmail"))) {
                        throw new RuntimeException("Customer has opted out of email notifications");
                    }
                    if ("CALL".equalsIgnoreCase(channel) && Boolean.FALSE.equals(customer.get("consentCall"))) {
                        throw new RuntimeException("Customer has opted out of call notifications");
                    }
                }
            } catch (RuntimeException e) {
                if (e.getMessage() != null && e.getMessage().startsWith("Customer has opted out")) {
                    throw e;
                }
            }
        }

        Notification n = toEntity(dto);
        n.setStatus(NotificationStatus.UNREAD);
        return toDTO(repo.save(n));
    }

    public List<NotificationResponseDTO> getAll() {
        return repo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<NotificationResponseDTO> getByCustomer(Long customerId) {
        return repo.findByCustomerId(customerId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<NotificationResponseDTO> getByLoan(Long loanAccountId) {
        return repo.findByLoanAccountId(loanAccountId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public NotificationResponseDTO markAsRead(Long id) {
        Notification n = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
        n.setStatus(NotificationStatus.READ);
        return toDTO(repo.save(n));
    }
}
