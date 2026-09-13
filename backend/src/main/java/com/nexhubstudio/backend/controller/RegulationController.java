package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.dto.RegulationRequest;
import com.nexhubstudio.backend.dto.RegulationResponse;
import com.nexhubstudio.backend.service.RegulationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 규격/규제 정보 컨트롤러
 * 엔드포인트는 프론트 src/api/regulation.js 와 1:1 이다.
 */
@RestController
@RequestMapping("/api/regulations")
@RequiredArgsConstructor
public class RegulationController {

    private final RegulationService regulationService;

    /**
     * 화면 진입 시 스냅샷 (레코드·항목·이력·충돌·첨부)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<RegulationResponse.Snapshot>> getSnapshot() {
        return ResponseEntity.ok(ApiResponse.success(regulationService.getSnapshot()));
    }

    /**
     * 저장 (신규 = INSERT, 기존 = 새 버전으로 UPDATE)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RegulationResponse.Record>> save(
            @RequestBody RegulationRequest.Save request,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        return ResponseEntity.ok(ApiResponse.success("저장되었습니다.", regulationService.save(request, userId)));
    }

    /**
     * 폐지 (물리 삭제 없이 EXPIRED)
     */
    @PostMapping("/{regInfoId}/expire")
    public ResponseEntity<ApiResponse<RegulationResponse.Record>> expire(
            @PathVariable Long regInfoId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        return ResponseEntity.ok(ApiResponse.success("폐지 처리되었습니다.", regulationService.expire(regInfoId, userId)));
    }

    /**
     * 등록은 취소했지만 충돌 감지 사실은 남기는 경우
     */
    @PostMapping("/conflict-histories")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> saveConflictHistories(
            @RequestBody RegulationRequest.ConflictHistories request,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        int count = regulationService.saveConflictHistories(request, userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }
}
