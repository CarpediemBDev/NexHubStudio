package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 충돌 판정 이력 (reg_conflict_hist)
 * 등록을 취소해도 행을 남긴다 (newRegInfoId = null, statusCd = IGNORED).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegConflictHist {
    private Long conflictId;
    private Long newRegInfoId;
    private String newRegNo;
    private Long existRegInfoId;
    private String existRegNo;
    private String conflictType;    // SAME, PARENT, CHILD, OVERLAP
    private String conflictAxis;    // GEO, ORG, RULE
    private String newScopeTxt;
    private String existScopeTxt;
    private String decisionCd;      // KEEP_BOTH, MERGE, EXCLUDE, REPLACE, CANCEL
    private String decisionNote;
    private LocalDateTime detectDt;
    private String decideId;
    private LocalDateTime decideDt;
    private String statusCd;        // RESOLVED, IGNORED
}
