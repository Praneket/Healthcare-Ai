package com.healthcare.diagnosis.service;

import com.healthcare.diagnosis.dto.DiagnosisDtos.DiagnosisEvent;
import com.healthcare.diagnosis.dto.DiagnosisDtos.ImagePredictionResponse;
import com.healthcare.diagnosis.kafka.DiagnosisEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageDiagnosisService {

    private final RestTemplate restTemplate;
    private final DiagnosisEventProducer eventProducer;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final java.util.Set<String> ALLOWED_TYPES =
        java.util.Set.of("image/jpeg", "image/png", "image/jpg");

    public ImagePredictionResponse predictFromImage(String userId, MultipartFile file, String diseaseType) {
        validateFile(file);

        try {
            // Build multipart request to AI service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() { return file.getOriginalFilename(); }
            };
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            // Pass disease_type as query param — FastAPI reads it from query string
            String aiUrl = aiServiceUrl + "/predict/image?disease_type=" + diseaseType;

            ResponseEntity<Map> aiResponse = restTemplate.exchange(aiUrl, HttpMethod.POST, requestEntity, Map.class);
            Map<?, ?> result = aiResponse.getBody();

            ImagePredictionResponse response = new ImagePredictionResponse();
            response.setDiseaseType(diseaseType);
            response.setPositive((Boolean) result.get("positive"));
            response.setConfidence(((Number) result.get("confidence")).doubleValue());
            response.setPredictedClass((String) result.get("predicted_class"));
            response.setMessage((String) result.get("message"));
            response.setFileName(file.getOriginalFilename());

            // Publish Kafka event so patient-records saves this too
            DiagnosisEvent event = new DiagnosisEvent();
            event.setUserId(userId);
            event.setDiseaseType(diseaseType);
            event.setPositive(response.isPositive());
            event.setConfidence(response.getConfidence());
            event.setMessage(response.getMessage());
            event.setFeatures(Map.of("fileName", file.getOriginalFilename(), "inputType", "image"));
            eventProducer.publishDiagnosisResult(event);

            return response;

        } catch (Exception e) {
            log.error("Image prediction failed for user {}", userId, e);
            throw new RuntimeException("Image prediction failed: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size must be under 10 MB");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Only JPEG/PNG images are accepted");
        }
    }
}
