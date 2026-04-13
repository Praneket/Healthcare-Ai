package com.healthcare.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        HttpStatus status = resolveStatus(ex.getMessage());
        return ResponseEntity.status(status).body(Map.of("message", ex.getMessage()));
    }

    private HttpStatus resolveStatus(String message) {
        if (message == null) return HttpStatus.INTERNAL_SERVER_ERROR;
        if (message.contains("already registered")) return HttpStatus.CONFLICT;          // 409
        if (message.contains("Invalid credentials")) return HttpStatus.UNAUTHORIZED;     // 401
        if (message.contains("not found")) return HttpStatus.NOT_FOUND;                  // 404
        return HttpStatus.BAD_REQUEST;                                                    // 400
    }
}
