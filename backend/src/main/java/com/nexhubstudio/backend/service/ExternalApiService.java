package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.exception.BusinessException;
import com.nexhubstudio.backend.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import org.springframework.web.client.RestTemplate;

/**
 * 외부 API 연동 서비스
 * - RestTemplate을 사용하여 외부(Mock) API를 호출
 * - 예외 발생 시 BusinessException(EXTERNAL_API_ERROR)으로 변환
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalApiService {

    private final RestTemplate restTemplate;

    // 로컬 환경이라 가정하고 호출
    private static final String BASE_URL = "http://localhost:8080/api/mock";

    public Object callExternalApiSuccess() {
        try {
            return restTemplate.getForObject(BASE_URL + "/success", Object.class);
        } catch (Exception e) {
            log.error("외부 API 호출 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.EXTERNAL_API_ERROR);
        }
    }

    public void callExternalApiFail() {
        try {
            log.info("외부 API 호출 시도 (실패 케이스)...");
            restTemplate.getForObject(BASE_URL + "/fail", String.class);
        } catch (Exception e) {
            // 여기서 예외를 잡아서 우리가 정의한 에러 코드로 변환하여 던짐
            log.error("외부 API 호출 중 예외 발생: {}", e.getMessage());
            throw new BusinessException(ErrorCode.EXTERNAL_API_ERROR);
        }
    }

    public void callExternalApiTimeout() {
        try {
            log.info("외부 API 호출 시도 (타임아웃 케이스)...");
            restTemplate.getForObject(BASE_URL + "/timeout", String.class);
        } catch (Exception e) {
            log.error("외부 API 호출 중 예외 발생 (Timeout 등): {}", e.getMessage());
            throw new BusinessException(ErrorCode.EXTERNAL_API_ERROR);
        }
    }
}
