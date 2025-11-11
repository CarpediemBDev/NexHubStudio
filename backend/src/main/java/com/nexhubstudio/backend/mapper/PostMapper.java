package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PostMapper {

    // 게시글 생성
    int insertPost(Post post);

    // 게시글 수정
    int updatePost(Post post);

    // 게시글 삭제 (물리 삭제)
    int deletePost(Long id);

    // 게시글 상태 변경 (논리 삭제)
    int updatePostStatus(@Param("id") Long id, @Param("status") String status);

    // 게시글 조회 (ID)
    Post findById(Long id);

    // 전체 게시글 조회
    List<Post> findAll();

    // 작성자별 게시글 조회
    List<Post> findByAuthorId(String authorId);

    // 상태별 게시글 조회
    List<Post> findByStatus(String status);

    // 조회수 증가
    int incrementViewCount(Long id);
}
