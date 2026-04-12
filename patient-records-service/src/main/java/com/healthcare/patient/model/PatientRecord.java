package com.healthcare.patient.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "patient_records")
@Data
public class PatientRecord {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String fullName;
    private int age;
    private String gender;
    private String bloodGroup;

    private List<DiagnosisHistory> diagnosisHistory = new ArrayList<>();
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Data
    public static class DiagnosisHistory {
        private String diseaseType;
        private boolean positive;
        private double confidence;
        private Map<String, Object> features;
        private LocalDateTime diagnosedAt = LocalDateTime.now();
    }
}
