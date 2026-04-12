package com.healthcare.patient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class PatientRecordsApplication {
    public static void main(String[] args) {
        SpringApplication.run(PatientRecordsApplication.class, args);
    }
}
