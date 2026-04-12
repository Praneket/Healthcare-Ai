package com.healthcare.notification.service;

import com.healthcare.notification.model.DiagnosisEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendDiagnosisNotification(DiagnosisEvent event) {
        String destination = "/topic/notifications/" + event.getUserId();
        String notificationMessage = buildMessage(event);

        // Push real-time notification via WebSocket
        messagingTemplate.convertAndSend(destination, notificationMessage);
        log.info("Sent notification to user {}: {}", event.getUserId(), notificationMessage);
    }

    private String buildMessage(DiagnosisEvent event) {
        String status = event.isPositive() ? "POSITIVE" : "NEGATIVE";
        return String.format("Your %s diagnosis result is %s. %s",
            event.getDiseaseType().replace("_", " "), status, event.getMessage());
    }
}
