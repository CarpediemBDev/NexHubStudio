package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.dto.EquipmentResponse;
import com.nexhubstudio.backend.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    /**
     * 전체 설비 조회
     */
    @GetMapping
    public ApiResponse<List<EquipmentResponse>> getAllEquipments() {
        return ApiResponse.success(equipmentService.getAllEquipments());
    }

    /**
     * 설비 상세 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<EquipmentResponse> getEquipment(@PathVariable Long id) {
        return ApiResponse.success(equipmentService.getEquipmentById(id));
    }

    /**
     * 설비 코드로 조회
     */
    @GetMapping("/code/{code}")
    public ApiResponse<EquipmentResponse> getEquipmentByCode(@PathVariable String code) {
        return ApiResponse.success(equipmentService.getEquipmentByCode(code));
    }

    /**
     * 층별 설비 조회
     */
    @GetMapping("/floor/{floor}")
    public ApiResponse<List<EquipmentResponse>> getEquipmentsByFloor(@PathVariable String floor) {
        return ApiResponse.success(equipmentService.getEquipmentsByFloor(floor));
    }

    /**
     * 상태별 설비 조회
     */
    @GetMapping("/status/{status}")
    public ApiResponse<List<EquipmentResponse>> getEquipmentsByStatus(@PathVariable String status) {
        return ApiResponse.success(equipmentService.getEquipmentsByStatus(status));
    }
}
