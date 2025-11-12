package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 설비 장비 엔티티
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipment {
    private Long id;
    private String equipmentCode; // 설비 코드 (EQ-001)
    private String equipmentName; // 설비명
    private String equipmentType; // 설비 타입 (CVD, ETCH, PHOTO 등)
    private String status; // NORMAL, WARNING, ERROR, MAINTENANCE, OFFLINE
    private Integer positionX; // 맵 X 좌표
    private Integer positionY; // 맵 Y 좌표
    private String floor; // 층수/구역
    private Double temperature; // 온도
    private Double pressure; // 압력
    private Integer cycleCount; // 작업 사이클 수
    private LocalDateTime lastCheckTime; // 마지막 체크 시간
    private String description; // 설명
}
