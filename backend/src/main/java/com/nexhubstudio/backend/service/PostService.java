package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.Post;
import com.nexhubstudio.backend.dto.PostRequest;
import com.nexhubstudio.backend.dto.PostResponse;
import com.nexhubstudio.backend.exception.BusinessException;
import com.nexhubstudio.backend.exception.ErrorCode;
import com.nexhubstudio.backend.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostMapper postMapper;

    /**
     * 게시글 생성
     */
    @Transactional
    public PostResponse createPost(PostRequest request, String authorId) {
        // 유효성 검증
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.POST_TITLE_REQUIRED);
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.POST_CONTENT_REQUIRED);
        }

        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .authorId(authorId)
                .status(request.getStatus() != null ? request.getStatus() : "PUBLISHED")
                .viewCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        postMapper.insertPost(post);
        return toResponse(post);
    }

    /**
     * 게시글 수정
     */
    @Transactional
    public PostResponse updatePost(Long id, PostRequest request, String currentUserId) {
        Post post = postMapper.findById(id);
        if (post == null) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND, "게시글 ID: " + id);
        }

        // 권한 체크 (작성자만 수정 가능)
        if (!post.getAuthorId().equals(currentUserId)) {
            throw new BusinessException(ErrorCode.POST_UPDATE_FORBIDDEN);
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        if (request.getStatus() != null) {
            post.setStatus(request.getStatus());
        }
        post.setUpdatedAt(LocalDateTime.now());

        postMapper.updatePost(post);
        return toResponse(post);
    }

    /**
     * 게시글 삭제
     */
    @Transactional
    public void deletePost(Long id, String currentUserId) {
        Post post = postMapper.findById(id);
        if (post == null) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        // 권한 체크
        if (!post.getAuthorId().equals(currentUserId)) {
            throw new BusinessException(ErrorCode.POST_DELETE_FORBIDDEN);
        }

        postMapper.deletePost(id);
    }

    /**
     * 게시글 조회 (조회수 증가)
     */
    @Transactional
    public PostResponse getPost(Long id) {
        Post post = postMapper.findById(id);
        if (post == null) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        // 조회수 증가
        postMapper.incrementViewCount(id);
        post.setViewCount(post.getViewCount() + 1);

        return toResponse(post);
    }

    /**
     * 전체 게시글 목록
     */
    public List<PostResponse> getAllPosts() {
        return postMapper.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 작성자별 게시글 목록
     */
    public List<PostResponse> getPostsByAuthor(String authorId) {
        return postMapper.findByAuthorId(authorId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private PostResponse toResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .authorId(post.getAuthorId())
                .status(post.getStatus())
                .viewCount(post.getViewCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
