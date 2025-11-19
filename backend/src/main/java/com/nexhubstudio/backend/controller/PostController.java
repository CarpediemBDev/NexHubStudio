package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.dto.PostRequest;
import com.nexhubstudio.backend.dto.PostResponse;
import com.nexhubstudio.backend.dto.CommentRequest;
import com.nexhubstudio.backend.dto.CommentResponse;
import com.nexhubstudio.backend.service.PostService;
import com.nexhubstudio.backend.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 게시판 컨트롤러
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final CommentService commentService;

    /**
     * 게시글 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @RequestBody PostRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        PostResponse post = postService.createPost(request, userId);
        return ResponseEntity.ok(ApiResponse.success("게시글 작성 성공", post));
    }

    /**
     * 게시글 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable Long id,
            @RequestBody PostRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        PostResponse post = postService.updatePost(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("게시글 수정 성공", post));
    }

    /**
     * 게시글 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        postService.deletePost(id, userId);
        return ResponseEntity.ok(ApiResponse.success("게시글 삭제 성공", null));
    }

    /**
     * 게시글 조회 (조회수 증가)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(@PathVariable Long id) {
        PostResponse post = postService.getPost(id);
        return ResponseEntity.ok(ApiResponse.success(post));
    }

    /**
     * 전체 게시글 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PostResponse>>> getAllPosts() {
        List<PostResponse> posts = postService.getAllPosts();
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    /**
     * 작성자별 게시글 목록
     */
    @GetMapping("/author/{authorId}")
    public ResponseEntity<ApiResponse<List<PostResponse>>> getPostsByAuthor(@PathVariable String authorId) {
        List<PostResponse> posts = postService.getPostsByAuthor(authorId);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    // ========== RESTful 계층적 댓글 API ==========

    /**
     * 특정 게시글의 댓글 목록
     */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getPostComments(@PathVariable Long postId) {
        List<CommentResponse> comments = commentService.getCommentsByPost(postId);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    /**
     * 특정 게시글에 댓글 작성
     */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createPostComment(
            @PathVariable Long postId,
            @RequestBody CommentRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        CommentResponse comment = commentService.createCommentInPost(postId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("댓글 작성 성공", comment));
    }
}
