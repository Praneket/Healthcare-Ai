package com.healthcare.diagnosis.dto;

import lombok.Data;
import java.util.Map;

public class DiagnosisDtos {

    @Data
    public static class PredictionRequest {
        private String diseaseType;
        private Map<String, Object> features;
    }

    @Data
    public static class PredictionResponse {
        private String diseaseType;
        private boolean positive;
        private double confidence;
        private String message;
        private boolean fromCache;
    }

    @Data
    public static class ImagePredictionResponse {
        private String diseaseType;
        private boolean positive;
        private double confidence;
        private String predictedClass;
        private String message;
        private String fileName;
    }

    @Data
    public static class DiagnosisEvent {
        private String userId;
        private String diseaseType;
        private boolean positive;
        private double confidence;
        private String message;
        private Map<String, Object> features;
    }
}
