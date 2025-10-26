package com.nexhubstudio.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class UserResponse {
    private String userId;
    private String name;
    private String dept;
    private String role;
    private String email;
    private String phone;
    private String status;
    private LocalDateTime lastLoginAt;
    private LocalDateTime tokenExpiredAt;
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
}

