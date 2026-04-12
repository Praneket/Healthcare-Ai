package com.healthcare.auth.dto;

import lombok.Data;

public class AuthDtos {

    @Data
    public static class RegisterRequest {
        private String email;
        private String password;
        private String fullName;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String userId;
        private String email;
        private String role;

        public AuthResponse(String token, String userId, String email, String role) {
            this.token = token;
            this.userId = userId;
            this.email = email;
            this.role = role;
        }
    }
}
