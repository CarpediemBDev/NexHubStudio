package com.nexhubstudio.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * 게시글 생성/수정 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostRequest {
    private Long id; // 수정 시 사용
    private String title;
    private String content;
    private String status; // PUBLISHED, DRAFT
    private List<Long> attachmentIds; // 업로드된 파일 id 목록 (선택)
}
