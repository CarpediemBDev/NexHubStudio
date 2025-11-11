package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.Comment;
import com.nexhubstudio.backend.domain.Post;
import com.nexhubstudio.backend.dto.CommentRequest;
import com.nexhubstudio.backend.dto.CommentResponse;
import com.nexhubstudio.backend.exception.BusinessException;
import com.nexhubstudio.backend.exception.ErrorCode;
import com.nexhubstudio.backend.mapper.CommentMapper;
import com.nexhubstudio.backend.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentMapper commentMapper;
    private final PostMapper postMapper;

    /**
     * 댓글 생성
     */
    @Transactional
    public CommentResponse createComment(CommentRequest request, String authorId) {
        // 유효성 검증
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.COMMENT_CONTENT_REQUIRED);
        }

        // 게시글 존재 확인
        Post post = postMapper.findById(request.getPostId());
        if (post == null) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        // 대댓글인 경우 부모 댓글 존재 확인
        if (request.getParentId() != null) {
            Comment parent = commentMapper.findById(request.getParentId());
            if (parent == null) {
                throw new BusinessException(ErrorCode.PARENT_COMMENT_NOT_FOUND);
            }
        }

        Comment comment = Comment.builder()
                .postId(request.getPostId())
                .parentId(request.getParentId())
                .content(request.getContent())
                .authorId(authorId)
                .createdAt(LocalDateTime.now())
                .build();

        commentMapper.insertComment(comment);
        return toResponse(comment);
    }

    /**
     * 댓글 수정
     */
    @Transactional
    public CommentResponse updateComment(Long id, CommentRequest request, String currentUserId) {
        Comment comment = commentMapper.findById(id);
        if (comment == null) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }

        // 권한 체크
        if (!comment.getAuthorId().equals(currentUserId)) {
            throw new BusinessException(ErrorCode.COMMENT_UPDATE_FORBIDDEN);
        }

        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());

        commentMapper.updateComment(comment);
        return toResponse(comment);
    }

    /**
     * 댓글 삭제
     */
    @Transactional
    public void deleteComment(Long id, String currentUserId) {
        Comment comment = commentMapper.findById(id);
        if (comment == null) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }

        // 권한 체크
        if (!comment.getAuthorId().equals(currentUserId)) {
            throw new BusinessException(ErrorCode.COMMENT_DELETE_FORBIDDEN);
        }

        commentMapper.deleteComment(id);
    }

    /**
     * 게시글별 댓글 목록
     */
    public List<CommentResponse> getCommentsByPost(Long postId) {
        return commentMapper.findByPostId(postId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse toResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .parentId(comment.getParentId())
                .content(comment.getContent())
                .authorId(comment.getAuthorId())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
