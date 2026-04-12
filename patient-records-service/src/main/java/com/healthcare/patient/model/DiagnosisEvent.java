package com.healthcare.patient.model;

import lombok.Data;
import java.util.Map;

@Data
public class DiagnosisEvent {
    private String userId;
    private String diseaseType;
    private boolean positive;
    private double confidence;
    private String message;
    private Map<String, Object> features;
}
