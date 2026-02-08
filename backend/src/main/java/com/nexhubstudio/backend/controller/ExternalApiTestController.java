package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.service.ExternalApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 외부 API 연동 테스트를 위한 진입점 컨트롤러
 * 사용자는 이 API를 호출하여 테스트 진행
 */
@RestController
@RequestMapping("/api/test/external")
@RequiredArgsConstructor
public class ExternalApiTestController {

    private final ExternalApiService externalApiService;

    @GetMapping("/success")
    public ApiResponse<Object> testSuccess() {
        Object result = externalApiService.callExternalApiSuccess();
        return ApiResponse.success(result);
    }

    @GetMapping("/fail")
    public ApiResponse<Void> testFail() {
        // 내부에서 예외가 발생하여 GlobalExceptionHandler가 처리하게 됨
        externalApiService.callExternalApiFail();
        return ApiResponse.success(null);
    }

    @GetMapping("/timeout")
    public ApiResponse<Void> testTimeout() {
        // 내부에서 예외가 발생하여 GlobalExceptionHandler가 처리하게 됨
        externalApiService.callExternalApiTimeout();
        return ApiResponse.success(null);
    }
}
