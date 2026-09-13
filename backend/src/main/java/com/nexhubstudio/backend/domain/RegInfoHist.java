package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 규제 정보 변경이력 (reg_info_hist) - append-only
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegInfoHist {
    private Long histId;
    private Long regInfoId;
    private Integer versionNo;
    private String changeType;      // INSERT, UPDATE, DELETE, CONFLICT_RESOLVE
    private String changeNote;
    private String snapshotJson;    // 그 버전의 기본정보 값
    private String masterChangedYn; // NULL = 과거 이관분(알 수 없음)
    private String changedItemIds;  // JSON 배열 문자열
    private String regId;
    private LocalDateTime regDt;
}
