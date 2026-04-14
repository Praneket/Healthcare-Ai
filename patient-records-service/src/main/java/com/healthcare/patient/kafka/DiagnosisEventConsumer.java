package com.healthcare.patient.kafka;

import com.healthcare.patient.model.DiagnosisEvent;
import com.healthcare.patient.service.PatientRecordService;
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

    private final PatientRecordService patientRecordService;

    @KafkaListener(topics = "diagnosis-results", groupId = "patient-records-group")
    public void consume(DiagnosisEvent event) {
        log.info("Received diagnosis event for user: {} disease: {}", event.getUserId(), event.getDiseaseType());
        try {
            patientRecordService.addDiagnosisHistory(
                event.getUserId(),
                event.getDiseaseType(),
                event.isPositive(),
                event.getConfidence(),
                event.getFeatures()
            );
        } catch (Exception e) {
            log.error("Failed to save diagnosis history for user: {}", event.getUserId(), e);
        }
    }
}
