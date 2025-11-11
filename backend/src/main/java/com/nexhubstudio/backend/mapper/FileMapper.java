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
}
