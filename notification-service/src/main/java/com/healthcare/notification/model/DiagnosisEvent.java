package com.healthcare.notification.model;

import lombok.Data;

@Data
public class DiagnosisEvent {
    private String userId;
    private String diseaseType;
    private boolean positive;
    private String message;
}
