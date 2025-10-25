
package com.nexhubstudio.backend.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class UserDto {
    private String userId;
    private String name;
    private String dept;
    private String role;
    private String email;
    private Boolean enabled;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Lombok으로 getter/setter, 기본 생성자 자동 생성
}
