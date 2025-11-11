package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 댓글 엔티티
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {
    private Long id;
    private Long postId; // 게시글 ID (posts.id FK)
    private Long parentId; // 부모 댓글 ID (대댓글용, null이면 최상위 댓글)
    private String content;
    private String authorId; // 작성자 ID (users.id FK)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
