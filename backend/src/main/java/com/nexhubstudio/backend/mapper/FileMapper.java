package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.File;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface FileMapper {

    // 파일 업로드 (메타데이터 저장)
    int insertFile(File file);

    // 파일 삭제
    int deleteFile(Long id);

    // 파일 조회 (ID)
    File findById(Long id);

    // 전체 파일 조회
    List<File> findAll();

    // 업로더별 파일 조회
    List<File> findByUploaderId(String uploaderId);

    // 파일 그룹 조회 (활성 파일만)
    List<File> findByFileGroupId(String fileGroupId);

    // 그룹 내 모든 파일을 삭제 표시 (soft delete)
    int markFilesAsDeleted(String fileGroupId);

    // 파일들에 대해 file_group_id 설정 (단일 파일씩 업데이트)
    int updateFilesSetGroup(@org.apache.ibatis.annotations.Param("fileGroupId") String fileGroupId,
            @org.apache.ibatis.annotations.Param("fileIds") java.util.List<Long> fileIds);
}
