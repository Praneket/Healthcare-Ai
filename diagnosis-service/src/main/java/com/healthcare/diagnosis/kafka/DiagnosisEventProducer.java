package com.healthcare.diagnosis.kafka;

import com.healthcare.diagnosis.dto.DiagnosisDtos.DiagnosisEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DiagnosisEventProducer {

    private static final String TOPIC = "diagnosis-results";

    @Autowired(required = false)
    private KafkaTemplate<String, DiagnosisEvent> kafkaTemplate;

    public void publishDiagnosisResult(DiagnosisEvent event) {
        if (kafkaTemplate == null) {
            log.info("Kafka not configured — skipping event publish for user {}", event.getUserId());
            return;
        }
        kafkaTemplate.send(TOPIC, event.getUserId(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.warn("Failed to publish diagnosis event for user {}: {}", event.getUserId(), ex.getMessage());
                } else {
                    log.info("Published diagnosis event for user {}", event.getUserId());
                }
            });
    }
}
