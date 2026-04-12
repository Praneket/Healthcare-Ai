package com.healthcare.patient.controller;

import com.healthcare.patient.model.PatientRecord;
import com.healthcare.patient.model.PatientRecord.DiagnosisHistory;
import com.healthcare.patient.service.PatientRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientRecordService patientRecordService;

    @GetMapping("/me")
    public ResponseEntity<PatientRecord> getMyRecord(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(patientRecordService.getOrCreateRecord(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<PatientRecord> updateProfile(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody PatientRecord profileData) {
        return ResponseEntity.ok(patientRecordService.updateProfile(userId, profileData));
    }

    // Returns history sorted by most recent, optionally filtered by disease type
    @GetMapping("/me/history")
    public ResponseEntity<List<DiagnosisHistory>> getDiagnosisHistory(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(required = false) String diseaseType) {
        List<DiagnosisHistory> history = patientRecordService.getOrCreateRecord(userId).getDiagnosisHistory();
        if (diseaseType != null && !diseaseType.isBlank()) {
            history = history.stream()
                .filter(h -> h.getDiseaseType().equalsIgnoreCase(diseaseType))
                .toList();
        }
        history = history.stream()
            .sorted(Comparator.comparing(DiagnosisHistory::getDiagnosedAt).reversed())
            .toList();
        return ResponseEntity.ok(history);
    }

    @GetMapping("/me/history/summary")
    public ResponseEntity<?> getHistorySummary(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(patientRecordService.getHistorySummary(userId));
    }
}
