package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.File;
import com.nexhubstudio.backend.dto.FileResponse;
import com.nexhubstudio.backend.exception.BusinessException;
import com.nexhubstudio.backend.exception.ErrorCode;
import com.nexhubstudio.backend.mapper.FileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final FileMapper fileMapper;
    private static final String UPLOAD_DIR = "uploads/";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    // 파일 타입 제한 완화 (개발 중)
    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
            "application/pdf",
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/vnd.ms-excel", // .xls
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "text/plain", // .txt
            "application/zip",
            "application/x-zip-compressed");

    /**
     * 파일 업로드
     */
    @Transactional
    public FileResponse uploadFile(MultipartFile multipartFile, String uploaderId) {
        // 파일 검증
        if (multipartFile.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        // 파일 크기 검증
        if (multipartFile.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        }

        // 파일 타입 검증 (contentType이 null인 경우 허용)
        String contentType = multipartFile.getContentType();
        if (contentType != null && !ALLOWED_TYPES.contains(contentType)) {
            log.warn("허용되지 않은 파일 타입: {}", contentType);
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }

        try {
            // 업로드 디렉토리 생성
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 파일명 생성 (UUID + 확장자)
            String originalName = multipartFile.getOriginalFilename();
            if (originalName == null || originalName.isEmpty()) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
            String extension = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : "";
            String storedName = UUID.randomUUID().toString() + extension;
            String filePath = UPLOAD_DIR + storedName;

            // 파일 저장
            Path targetPath = uploadPath.resolve(storedName);
            Files.copy(multipartFile.getInputStream(), targetPath);

            // DB에 메타데이터 저장
            File file = File.builder()
                    .originalName(originalName)
                    .storedName(storedName)
                    .filePath(filePath)
                    .fileSize(multipartFile.getSize())
                    .contentType(contentType)
                    .uploaderId(uploaderId)
                    .uploadedAt(LocalDateTime.now())
                    .build();

            fileMapper.insertFile(file);
            return toResponse(file);

        } catch (IOException e) {
            log.error("파일 업로드 실패: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    /**
     * 파일 삭제
     */
    @Transactional
    public void deleteFile(Long id, String currentUserId) {
        File file = fileMapper.findById(id);
        if (file == null) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }

        // 권한 체크
        if (!file.getUploaderId().equals(currentUserId)) {
            throw new BusinessException(ErrorCode.FILE_DELETE_FORBIDDEN);
        }

        // 물리적 파일 삭제
        try {
            Path filePath = Paths.get(file.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("파일 삭제 실패: {}", e.getMessage(), e);
        }

        // DB에서 삭제
        fileMapper.deleteFile(id);
    }

    /**
     * 파일 조회
     */
    public FileResponse getFile(Long id) {
        File file = fileMapper.findById(id);
        if (file == null) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return toResponse(file);
    }

    /**
     * 전체 파일 목록
     */
    public List<FileResponse> getAllFiles() {
        return fileMapper.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private FileResponse toResponse(File file) {
        return FileResponse.builder()
                .id(file.getId())
                .originalName(file.getOriginalName())
                .storedName(file.getStoredName())
                .filePath(file.getFilePath())
                .fileSize(file.getFileSize())
                .contentType(file.getContentType())
                .uploaderId(file.getUploaderId())
                .uploadedAt(file.getUploadedAt())
                .build();
    }
}
