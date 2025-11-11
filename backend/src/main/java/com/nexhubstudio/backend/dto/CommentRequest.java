package com.nexhubstudio.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 댓글 생성/수정 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentRequest {
    private Long id; // 수정 시 사용
    private Long postId;
    private Long parentId; // 대댓글인 경우 부모 댓글 ID
    private String content;
}
