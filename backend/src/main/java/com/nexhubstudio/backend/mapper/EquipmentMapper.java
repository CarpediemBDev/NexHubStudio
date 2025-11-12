package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.Equipment;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface EquipmentMapper {

    // 전체 설비 조회
    List<Equipment> findAll();

    // 설비 조회 (ID)
    Equipment findById(Long id);

    // 설비 조회 (코드)
    Equipment findByCode(String equipmentCode);

    // 층/구역별 설비 조회
    List<Equipment> findByFloor(String floor);

    // 상태별 설비 조회
    List<Equipment> findByStatus(String status);

    // 설비 상태 업데이트
    int updateStatus(Equipment equipment);
}
