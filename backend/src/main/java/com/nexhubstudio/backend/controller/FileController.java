package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.dto.FileResponse;
import com.nexhubstudio.backend.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * 파일 컨트롤러
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * 파일 업로드
     */
    @PostMapping
    public ResponseEntity<ApiResponse<FileResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        FileResponse fileResponse = fileService.uploadFile(file, userId);
        return ResponseEntity.ok(ApiResponse.success("파일 업로드 성공", fileResponse));
    }

    /**
     * 파일 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        fileService.deleteFile(id, userId);
        return ResponseEntity.ok(ApiResponse.success("파일 삭제 성공", null));
    }

    /**
     * 파일 정보 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FileResponse>> getFile(@PathVariable Long id) {
        FileResponse file = fileService.getFile(id);
        return ResponseEntity.ok(ApiResponse.success(file));
    }

    /**
     * 전체 파일 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FileResponse>>> getAllFiles() {
        List<FileResponse> files = fileService.getAllFiles();
        return ResponseEntity.ok(ApiResponse.success(files));
    }

    /**
     * 파일 다운로드
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) throws MalformedURLException {
        FileResponse fileInfo = fileService.getFile(id);
        Path filePath = Paths.get(fileInfo.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileInfo.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileInfo.getOriginalName() + "\"")
                .body(resource);
    }
}
