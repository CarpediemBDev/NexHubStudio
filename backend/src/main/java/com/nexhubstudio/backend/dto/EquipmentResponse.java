package com.nexhubstudio.backend.dto;

import com.nexhubstudio.backend.domain.Equipment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 설비 상태 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentResponse {
    private Long id;
    private String equipmentCode;
    private String equipmentName;
    private String equipmentType;
    private String status; // NORMAL, WARNING, ERROR, MAINTENANCE, OFFLINE
    private Integer positionX;
    private Integer positionY;
    private String floor;
    private Double temperature;
    private Double pressure;
    private Integer cycleCount;
    private LocalDateTime lastCheckTime;
    private String description;

    // 상태 색상 (프론트엔드용)
    public String getStatusColor() {
        switch (status) {
            case "NORMAL":
                return "#28a745"; // 녹색
            case "WARNING":
                return "#ffc107"; // 노란색
            case "ERROR":
                return "#dc3545"; // 빨간색
            case "MAINTENANCE":
                return "#6c757d"; // 회색
            case "OFFLINE":
                return "#343a40"; // 검정
            default:
                return "#6c757d";
        }
    }

    // Equipment 엔티티로부터 DTO 생성
    public static EquipmentResponse from(Equipment equipment) {
        return EquipmentResponse.builder()
                .id(equipment.getId())
                .equipmentCode(equipment.getEquipmentCode())
                .equipmentName(equipment.getEquipmentName())
                .equipmentType(equipment.getEquipmentType())
                .status(equipment.getStatus())
                .positionX(equipment.getPositionX())
                .positionY(equipment.getPositionY())
                .floor(equipment.getFloor())
                .temperature(equipment.getTemperature())
                .pressure(equipment.getPressure())
                .cycleCount(equipment.getCycleCount())
                .lastCheckTime(equipment.getLastCheckTime())
                .description(equipment.getDescription())
                .build();
    }
}
