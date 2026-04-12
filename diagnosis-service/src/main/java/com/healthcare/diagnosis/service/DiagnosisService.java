package com.healthcare.diagnosis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.diagnosis.dto.DiagnosisDtos.*;
import com.healthcare.diagnosis.kafka.DiagnosisEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
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
        Map<?, ?> aiResponse = restTemplate.postForObject(aiUrl, request.getFeatures(), Map.class);

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

        // 4. Publish Kafka event for notification + patient-records services
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

    private String buildCacheKey(PredictionRequest request) {
        return "diagnosis:" + request.getDiseaseType() + ":" + request.getFeatures().hashCode();
    }
}
