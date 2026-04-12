package com.healthcare.patient.service;

import com.healthcare.patient.model.PatientRecord;
import com.healthcare.patient.model.PatientRecord.DiagnosisHistory;
import com.healthcare.patient.repository.PatientRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientRecordService {

    private final PatientRecordRepository repository;

    public PatientRecord getOrCreateRecord(String userId) {
        return repository.findByUserId(userId)
            .orElseGet(() -> {
                PatientRecord record = new PatientRecord();
                record.setUserId(userId);
                return repository.save(record);
            });
    }

    public PatientRecord updateProfile(String userId, PatientRecord profileData) {
        PatientRecord record = getOrCreateRecord(userId);
        record.setFullName(profileData.getFullName());
        record.setAge(profileData.getAge());
        record.setGender(profileData.getGender());
        record.setBloodGroup(profileData.getBloodGroup());
        record.setUpdatedAt(LocalDateTime.now());
        return repository.save(record);
    }

    public PatientRecord addDiagnosisHistory(String userId, String diseaseType,
                                              boolean positive, double confidence,
                                              Map<String, Object> features) {
        PatientRecord record = getOrCreateRecord(userId);
        DiagnosisHistory history = new DiagnosisHistory();
        history.setDiseaseType(diseaseType);
        history.setPositive(positive);
        history.setConfidence(confidence);
        history.setFeatures(features);
        record.getDiagnosisHistory().add(history);
        record.setUpdatedAt(LocalDateTime.now());
        return repository.save(record);
    }

    // Returns per-disease counts and last result for the summary card on the frontend
    public Map<String, Object> getHistorySummary(String userId) {
        List<DiagnosisHistory> history = getOrCreateRecord(userId).getDiagnosisHistory();

        Map<String, Long> countByDisease = history.stream()
            .collect(Collectors.groupingBy(DiagnosisHistory::getDiseaseType, Collectors.counting()));

        Map<String, DiagnosisHistory> latestByDisease = history.stream()
            .collect(Collectors.toMap(
                DiagnosisHistory::getDiseaseType,
                h -> h,
                (existing, replacement) ->
                    existing.getDiagnosedAt().isAfter(replacement.getDiagnosedAt()) ? existing : replacement
            ));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalDiagnoses", history.size());
        summary.put("countByDisease", countByDisease);
        summary.put("latestByDisease", latestByDisease);
        return summary;
    }
}
