package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.domain.CommonCode;
import com.nexhubstudio.backend.dto.CommonCodeRequest;
import com.nexhubstudio.backend.dto.CommonCodeBulkRequest;
import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.service.CommonCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/common-codes")
public class CommonCodeController {

    @Autowired
    private CommonCodeService commonCodeService;

    @PostMapping
    public ResponseEntity<ApiResponse<Integer>> createCommonCode(@RequestBody CommonCodeRequest request) {
        int result = commonCodeService.createCommonCode(request);
        return ResponseEntity.ok(ApiResponse.success("공통코드 등록 성공", result));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Integer>> updateCommonCode(@RequestBody CommonCodeRequest request) {
        int result = commonCodeService.updateCommonCode(request);
        return ResponseEntity.ok(ApiResponse.success("공통코드 수정 성공", result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> deleteCommonCode(@PathVariable Long id) {
        int result = commonCodeService.deleteCommonCode(id);
        return ResponseEntity.ok(ApiResponse.success("공통코드 삭제 성공", result));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommonCode>>> getAllCommonCodes() {
        List<CommonCode> codes = commonCodeService.getAllCommonCodes();
        return ResponseEntity.ok(ApiResponse.success(codes));
    }

    @GetMapping("/group/{codeGroupId}")
    public ResponseEntity<ApiResponse<List<CommonCode>>> getCommonCodesByGroupId(@PathVariable Long codeGroupId) {
        List<CommonCode> codes = commonCodeService.getCommonCodesByGroupId(codeGroupId);
        return ResponseEntity.ok(ApiResponse.success(codes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonCode>> getCommonCodeById(@PathVariable Long id) {
        CommonCode code = commonCodeService.getCommonCodeById(id);
        return ResponseEntity.ok(ApiResponse.success(code));
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> bulkSave(@RequestBody CommonCodeBulkRequest bulk) {
        int[] counts = commonCodeService.bulkSave(bulk);
        Map<String, Integer> result = Map.of(
                "created", counts[0],
                "updated", counts[1],
                "deleted", counts[2]);
        return ResponseEntity.ok(ApiResponse.success("일괄 처리 성공", result));
    }
}
