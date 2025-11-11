package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.Comment;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CommentMapper {

    // 댓글 생성
    int insertComment(Comment comment);

    // 댓글 수정
    int updateComment(Comment comment);

    // 댓글 삭제
    int deleteComment(Long id);

    // 댓글 조회 (ID)
    Comment findById(Long id);

    // 게시글별 댓글 조회
    List<Comment> findByPostId(Long postId);

    // 부모 댓글의 대댓글 조회
    List<Comment> findByParentId(Long parentId);

    // 작성자별 댓글 조회
    List<Comment> findByAuthorId(String authorId);
}
