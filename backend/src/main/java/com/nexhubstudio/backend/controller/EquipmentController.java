package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.dto.EquipmentResponse;
import com.nexhubstudio.backend.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    /**
     * 전체 설비 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getAllEquipments() {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.getAllEquipments()));
    }

    /**
     * 설비 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> getEquipment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.getEquipmentById(id)));
    }

    /**
     * 설비 코드로 조회
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> getEquipmentByCode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.getEquipmentByCode(code)));
    }

    /**
     * 층별 설비 조회
     */
    @GetMapping("/floor/{floor}")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getEquipmentsByFloor(@PathVariable String floor) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.getEquipmentsByFloor(floor)));
    }

    /**
     * 상태별 설비 조회
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getEquipmentsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.getEquipmentsByStatus(status)));
    }
}
