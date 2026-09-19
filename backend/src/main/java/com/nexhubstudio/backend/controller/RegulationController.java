package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.dto.RegulationRequest;
import com.nexhubstudio.backend.dto.RegulationResponse;
import com.nexhubstudio.backend.service.RegulationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nexhubstudio.backend.domain.RegCode;

import java.util.List;
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
     * 전개(행→열) 목록.
     * 조회지만 POST 다 — 조회 결과가 수천 건이면 ID 목록이 URL 길이 제한을 넘는다.
     */
    @PostMapping("/expanded")
    public ResponseEntity<ApiResponse<RegulationResponse.Expanded>> expanded(
            @RequestBody RegulationRequest.Expand request) {
        return ResponseEntity.ok(ApiResponse.success(regulationService.expand(request)));
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
     * 규제 코드 계층 (분야 · 권역&gt;국가 · 사업부&gt;제품군&gt;제품 · 규제&gt;규격&gt;인증서).
     * 키는 target_type / item_type_cd 값과 같다.
     */
    @GetMapping("/codes")
    public ResponseEntity<ApiResponse<Map<String, List<RegCode>>>> getCodes() {
        return ResponseEntity.ok(ApiResponse.success(regulationService.getCodes()));
    }

    /**
     * 상태 변경 — 확정(ACTIVE) · 재검토(REVIEW) · 폐지(EXPIRED) · 복원.
     * 전이마다 엔드포인트를 두지 않고 목적지만 받는다. 갈 수 있는지는 서비스의 전이표가 정한다.
     */
    @PostMapping("/{regInfoId}/status")
    public ResponseEntity<ApiResponse<RegulationResponse.Record>> changeStatus(
            @PathVariable Long regInfoId,
            @RequestBody RegulationRequest.ChangeStatus request,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {
        return ResponseEntity.ok(ApiResponse.success("상태가 변경되었습니다.",
                regulationService.changeStatus(regInfoId, request.getStatusCd(), userId)));
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
