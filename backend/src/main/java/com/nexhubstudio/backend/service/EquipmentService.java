package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.Equipment;
import com.nexhubstudio.backend.dto.EquipmentResponse;
import com.nexhubstudio.backend.exception.BusinessException;
import com.nexhubstudio.backend.exception.ErrorCode;
import com.nexhubstudio.backend.mapper.EquipmentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EquipmentService {

    private final EquipmentMapper equipmentMapper;

    /**
     * 전체 설비 조회
     */
    public List<EquipmentResponse> getAllEquipments() {
        return equipmentMapper.findAll().stream()
                .map(EquipmentResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 설비 상세 조회
     */
    public EquipmentResponse getEquipmentById(Long id) {
        Equipment equipment = equipmentMapper.findById(id);
        if (equipment == null) {
            throw new BusinessException(ErrorCode.EQUIPMENT_NOT_FOUND, "설비를 찾을 수 없습니다. ID: " + id);
        }
        return EquipmentResponse.from(equipment);
    }

    /**
     * 설비 코드로 조회
     */
    public EquipmentResponse getEquipmentByCode(String code) {
        Equipment equipment = equipmentMapper.findByCode(code);
        if (equipment == null) {
            throw new BusinessException(ErrorCode.EQUIPMENT_NOT_FOUND, "설비를 찾을 수 없습니다. Code: " + code);
        }
        return EquipmentResponse.from(equipment);
    }

    /**
     * 층별 설비 조회
     */
    public List<EquipmentResponse> getEquipmentsByFloor(String floor) {
        return equipmentMapper.findByFloor(floor).stream()
                .map(EquipmentResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 상태별 설비 조회
     */
    public List<EquipmentResponse> getEquipmentsByStatus(String status) {
        return equipmentMapper.findByStatus(status).stream()
                .map(EquipmentResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 설비 상태 업데이트 (시뮬레이션용)
     */
    @Transactional
    public EquipmentResponse updateEquipmentStatus(Long id, Equipment updateData) {
        Equipment equipment = equipmentMapper.findById(id);
        if (equipment == null) {
            throw new BusinessException(ErrorCode.EQUIPMENT_NOT_FOUND, "설비를 찾을 수 없습니다. ID: " + id);
        }

        equipment.setStatus(updateData.getStatus());
        equipment.setTemperature(updateData.getTemperature());
        equipment.setPressure(updateData.getPressure());
        equipment.setCycleCount(updateData.getCycleCount());
        equipment.setLastCheckTime(updateData.getLastCheckTime());

        equipmentMapper.updateStatus(equipment);

        return EquipmentResponse.from(equipment);
    }
}
