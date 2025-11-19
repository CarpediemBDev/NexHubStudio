package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 파일 엔티티
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class File {
    private Long id;
    private String originalName; // 원본 파일명
    private String storedName; // 저장된 파일명 (UUID 등)
    private String filePath; // 파일 경로
    private Long fileSize; // 파일 크기 (bytes)
    private String contentType; // MIME 타입 (image/jpeg 등)
    private String uploaderId; // 업로더 ID (users.id FK)
    private LocalDateTime uploadedAt;
    private String fileGroupId; // 파일 그룹 ID (ULID 기반, FG_POST_xxx 형식)
    private String delYn; // 삭제 여부 (Y/N)
}
