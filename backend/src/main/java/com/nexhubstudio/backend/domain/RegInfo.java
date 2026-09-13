package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 규격/규제 정보 레코드 (reg_info)
 * 항상 현재 값만 가진다. 과거 값은 reg_info_hist 스냅샷에 있다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegInfo {
    private Long regInfoId;
    private String regNo;           // REG-{연도}-{4자리}
    private String title;
    private String fieldCd;         // 분야 (단일 값, 충돌 판정 1차 필터)
    private String markNm;
    private String authority;
    private String url;
    private String summary;
    private String statusCd;        // DRAFT, REVIEW, ACTIVE, EXPIRED
    private Integer versionNo;
    private LocalDate effectiveDt;
    private String attachGroupId;   // files.file_group_id
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
