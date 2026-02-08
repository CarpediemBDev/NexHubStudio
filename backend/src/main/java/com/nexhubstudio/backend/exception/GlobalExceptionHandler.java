package com.nexhubstudio.backend.exception;

import com.nexhubstudio.backend.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.UUID;

/**
 * 전역 예외 처리 핸들러
 * - 모든 예외를 ApiResponse 형식으로 통일하여 반환
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * BusinessException 처리 (비즈니스 로직 예외)
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        String traceId = UUID.randomUUID().toString();
        log.error("[{}] Business Exception: {} - {}", traceId, e.getCode(), e.getMessage());
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(e.getCode())
                .message(e.getMessage())
                .data(null)
                .traceId(traceId)
                .build();
        return ResponseEntity.status(e.getStatus()).body(response);
    }

    /**
     * IllegalArgumentException 처리 (잘못된 파라미터)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
        String traceId = UUID.randomUUID().toString();
        log.error("[{}] Invalid Argument: {}", traceId, e.getMessage());
        String message = e.getMessage() != null ? e.getMessage() : ErrorCode.INVALID_INPUT.getMessage();
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(ErrorCode.INVALID_INPUT.getCode())
                .message(message)
                .data(null)
                .traceId(traceId)
                .build();
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Validation 예외 처리 (@Valid 검증 실패)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String traceId = UUID.randomUUID().toString();
        log.error("[{}] Validation Error: {}", traceId, e.getMessage());
        String message = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(ErrorCode.INVALID_INPUT.getCode())
                .message(message)
                .data(null)
                .traceId(traceId)
                .build();
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 기타 모든 예외 처리
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        String traceId = UUID.randomUUID().toString();
        log.error("[{}] Unexpected Exception: {}", traceId, e.getMessage(), e);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                .message("서버 오류가 발생했습니다.")
                .data(null)
                .traceId(traceId)
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
