package com.healthcare.patient.repository;

import com.healthcare.patient.model.PatientRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PatientRecordRepository extends MongoRepository<PatientRecord, String> {
    Optional<PatientRecord> findByUserId(String userId);
}
