package com.healthcare.diagnosis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.diagnosis.dto.DiagnosisDtos.*;
import com.healthcare.diagnosis.kafka.DiagnosisEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiagnosisService {

    private final StringRedisTemplate redisTemplate;
    private final RestTemplate restTemplate;
    private final DiagnosisEventProducer eventProducer;
    private final ObjectMapper objectMapper;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @Value("${cache.ttl-seconds}")
    private long cacheTtlSeconds;

    @Value("${patient.service.url}")
    private String patientServiceUrl;

    public PredictionResponse predict(String userId, PredictionRequest request) {
        String cacheKey = buildCacheKey(request);

        // 1. Check Redis cache first
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                PredictionResponse response = objectMapper.readValue(cached, PredictionResponse.class);
                response.setFromCache(true);
                return response;
            } catch (Exception e) {
                log.warn("Cache deserialization failed, fetching fresh prediction");
            }
        }

        // 2. Call Python AI service
        String aiUrl = aiServiceUrl + "/predict/" + request.getDiseaseType();
        Map<String, Object> aiRequestBody = Map.of("features", request.getFeatures());
        Map<?, ?> aiResponse = restTemplate.postForObject(aiUrl, aiRequestBody, Map.class);

        PredictionResponse response = new PredictionResponse();
        response.setDiseaseType(request.getDiseaseType());
        response.setPositive((Boolean) aiResponse.get("positive"));
        response.setConfidence(((Number) aiResponse.get("confidence")).doubleValue());
        response.setMessage((String) aiResponse.get("message"));
        response.setFromCache(false);

        // 3. Cache the result
        try {
            redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(response),
                Duration.ofSeconds(cacheTtlSeconds));
        } catch (Exception e) {
            log.warn("Failed to cache prediction result");
        }

        // 4. Save history directly to patient-records-service (synchronous — instant)
        saveHistoryDirectly(userId, request, response);

        // 5. Also publish Kafka event for notification service
        DiagnosisEvent event = new DiagnosisEvent();
        event.setUserId(userId);
        event.setDiseaseType(request.getDiseaseType());
        event.setPositive(response.isPositive());
        event.setConfidence(response.getConfidence());
        event.setMessage(response.getMessage());
        event.setFeatures(request.getFeatures());
        eventProducer.publishDiagnosisResult(event);

        return response;
    }

    private void saveHistoryDirectly(String userId, PredictionRequest request, PredictionResponse response) {
        try {
            String url = patientServiceUrl + "/patients/me/history";

            Map<String, Object> body = new HashMap<>();
            body.put("diseaseType", request.getDiseaseType());
            body.put("positive", response.isPositive());
            body.put("confidence", response.getConfidence());
            body.put("features", request.getFeatures());

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-User-Id", userId);
            headers.set("Content-Type", "application/json");

            restTemplate.postForObject(url, new HttpEntity<>(body, headers), Object.class);
            log.info("Saved history directly for user {} disease {}", userId, request.getDiseaseType());
        } catch (Exception e) {
            log.warn("Direct history save failed (Kafka will retry): {}", e.getMessage());
        }
    }

    private String buildCacheKey(PredictionRequest request) {
        return "diagnosis:" + request.getDiseaseType() + ":" + request.getFeatures().hashCode();
    }
}
