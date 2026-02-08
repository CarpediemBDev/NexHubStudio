package com.nexhubstudio.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 가상의 외부 API 역할을 하는 컨트롤러
 * (실제 외부 서버라고 가정)
 */
@RestController
@RequestMapping("/api/mock")
public class MockExternalController {

    @GetMapping("/success")
    public ResponseEntity<Map<String, String>> mockSuccess() {
        Map<String, String> data = new HashMap<>();
        data.put("result", "ok");
        data.put("externalData", "외부 시스템에서 가져온 데이터입니다.");
        return ResponseEntity.ok(data);
    }

    @GetMapping("/fail")
    public ResponseEntity<String> mockFail() {
        // 500 에러를 의도적으로 발생시킴
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("외부 시스템 내부 오류 발생!");
    }

    @GetMapping("/timeout")
    public ResponseEntity<String> mockTimeout() throws InterruptedException {
        // 5초 지연 (타임아웃 발생 유도)
        Thread.sleep(5000);
        return ResponseEntity.ok("지연 응답 성공");
    }
}
