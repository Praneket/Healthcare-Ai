package com.healthcare.diagnosis.controller;

import com.healthcare.diagnosis.dto.DiagnosisDtos.*;
import com.healthcare.diagnosis.service.DiagnosisService;
import com.healthcare.diagnosis.service.ImageDiagnosisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/diagnosis")
@RequiredArgsConstructor
public class DiagnosisController {

    private final DiagnosisService diagnosisService;
    private final ImageDiagnosisService imageDiagnosisService;

    @PostMapping("/predict")
    public ResponseEntity<PredictionResponse> predict(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody PredictionRequest request) {
        return ResponseEntity.ok(diagnosisService.predict(userId, request));
    }

    @PostMapping(value = "/predict/image", consumes = "multipart/form-data")
    public ResponseEntity<ImagePredictionResponse> predictImage(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "chest_xray") String diseaseType) {
        return ResponseEntity.ok(imageDiagnosisService.predictFromImage(userId, file, diseaseType));
    }
}
