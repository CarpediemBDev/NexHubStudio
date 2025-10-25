package com.nexhubstudio.backend.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @Column(length = 50, nullable = false, unique = true)
    private String userId; // 시스템 식별자, 로그인 ID

    @Column(length = 50, nullable = false)
    private String name; // 사용자 실명/표시명

    @Column(length = 50)
    private String dept; // 부서명

    @Column(length = 30)
    private String role; // 역할/직무

    @Column(length = 100, unique = true)
    private String email; // 이메일

    @Column(length = 255)
    private String password; // 암호화된 비밀번호

    @Column(nullable = false)
    private Boolean enabled = true; // 계정 활성화 여부

    private LocalDateTime lastLoginAt; // 마지막 로그인 일시

    // 메타데이터
    @Column(length = 50)
    private String createdBy;
    private LocalDateTime createdAt;
    @Column(length = 50)
    private String updatedBy;
    private LocalDateTime updatedAt;

    // JWT 리프레시 토큰 관리
    @Column(length = 512)
    private String refreshToken;
    private LocalDateTime tokenExpiredAt;

}
