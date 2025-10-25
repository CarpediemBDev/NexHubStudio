package com.nexhubstudio.backend.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class User {
    private String userId; // 시스템 식별자, 로그인 ID
    private String name; // 사용자 실명/표시명
    private String dept; // 부서명
    private String role; // 역할/직무
    private String email; // 이메일
    private String password; // 암호화된 비밀번호
    private String phone; // 전화번호
    private String status; // 계정 상태
    private LocalDateTime lastLoginAt; // 마지막 로그인 일시
    private String refreshToken;
    private LocalDateTime tokenExpiredAt;
    // 메타데이터
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
