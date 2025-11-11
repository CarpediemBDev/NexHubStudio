package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.dto.CommentRequest;
import com.nexhubstudio.backend.dto.CommentResponse;
import com.nexhubstudio.backend.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 댓글 컨트롤러
 */
@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * 댓글 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @RequestBody CommentRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        CommentResponse comment = commentService.createComment(request, userId);
        return ResponseEntity.ok(ApiResponse.success("댓글 작성 성공", comment));
    }

    /**
     * 댓글 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long id,
            @RequestBody CommentRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        CommentResponse comment = commentService.updateComment(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("댓글 수정 성공", comment));
    }

    /**
     * 댓글 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        commentService.deleteComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("댓글 삭제 성공", null));
    }

    /**
     * 게시글별 댓글 목록
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getCommentsByPost(@PathVariable Long postId) {
        List<CommentResponse> comments = commentService.getCommentsByPost(postId);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }
}
