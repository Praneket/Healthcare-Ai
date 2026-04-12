package com.healthcare.diagnosis.kafka;

import com.healthcare.diagnosis.dto.DiagnosisDtos.DiagnosisEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DiagnosisEventProducer {

    private static final String TOPIC = "diagnosis-results";
    private final KafkaTemplate<String, DiagnosisEvent> kafkaTemplate;

    public void publishDiagnosisResult(DiagnosisEvent event) {
        kafkaTemplate.send(TOPIC, event.getUserId(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish diagnosis event for user {}", event.getUserId(), ex);
                } else {
                    log.info("Published diagnosis event for user {}", event.getUserId());
                }
            });
    }
}
