package com.healthcare.notification.kafka;

import com.healthcare.notification.model.DiagnosisEvent;
import com.healthcare.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.kafka.bootstrap-servers", matchIfMissing = false)
public class DiagnosisEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "diagnosis-results", groupId = "notification-group")
    public void consume(DiagnosisEvent event) {
        log.info("Received diagnosis event for user: {}", event.getUserId());
        notificationService.sendDiagnosisNotification(event);
    }
}
