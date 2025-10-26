
package com.nexhubstudio.backend.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class UserRequest {
    private String userId;
    private String name;
    private String dept;
    private String role;
    private String email;
    private String password;
    private String phone;
    private String status;
    private LocalDateTime lastLoginAt;
    private String refreshToken;
    private LocalDateTime tokenExpiredAt;
    // 메타데이터
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;

    // Lombok으로 getter/setter, 기본 생성자 자동 생성
}
