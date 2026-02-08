package com.nexhubstudio.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

/**
 * API 공통 응답 DTO
 * - 모든 API 응답을 통일된 형식으로 제공
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private String code;
    private String message;
    private T data;
    private String traceId;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code("SUCCESS")
                .message("성공")
                .data(data)
                .traceId(UUID.randomUUID().toString())
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .code("SUCCESS")
                .message(message)
                .data(data)
                .traceId(UUID.randomUUID().toString())
                .build();
    }
}
