package com.nexhubstudio.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import com.nexhubstudio.backend.domain.File;

/**
 * 게시글 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {
    private Long id;
    private String title;
    private String content;
    private String authorId;
    private String authorName; // 작성자 이름 (JOIN으로 가져옴)
    private String status;
    private Integer viewCount;
    private Boolean isPublic; // 공개여부
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<File> attachments; // 첨부파일 목록
}
