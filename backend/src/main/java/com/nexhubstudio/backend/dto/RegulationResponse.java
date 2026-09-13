package com.nexhubstudio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.nexhubstudio.backend.domain.RegInfoItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 규격/규제 정보 응답 DTO
 * 필드명·날짜 포맷은 프론트 목업(src/data/regulationMock.js)과 같게 맞춘다.
 * 그래야 목업 모드와 실제 모드에서 화면 코드가 달라지지 않는다.
 */
public class RegulationResponse {

    private RegulationResponse() {
    }

    /** GET /api/regulations — 화면 진입 시 한 번에 받는 스냅샷 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Snapshot {
        private List<Record> records;
        private List<RegInfoItem> items;
        private List<History> histories;
        private List<Conflict> conflicts;
        /** regInfoId → 첨부 목록 */
        private Map<Long, List<Attach>> attachments;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Record {
        private Long regInfoId;
        private String regNo;
        private String title;
        private String fieldCd;
        private String markNm;
        private String authority;
        private String url;
        private String summary;
        private String statusCd;
        private Integer versionNo;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate effectiveDt;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDateTime modDt;
        private String modId;
        private Integer attachCnt;
        private List<Target> targets;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Target {
        private String targetType;
        private String targetCd;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class History {
        private Long histId;
        private Long regInfoId;
        private Integer versionNo;
        private String changeType;
        private String changeNote;
        private String regId;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        private LocalDateTime regDt;
        private String snapshotJson;
        /** null = 과거 이관분이라 알 수 없음 */
        private Boolean masterChanged;
        private List<Long> changedItemIds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Conflict {
        private Long conflictId;
        private String newRegNo;
        private Long newRegInfoId;
        private String existRegNo;
        private Long existRegInfoId;
        private String conflictType;
        private String conflictAxis;
        private String newScopeTxt;
        private String existScopeTxt;
        private String decisionCd;
        private String decisionNote;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        private LocalDateTime detectDt;
        private String decideId;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        private LocalDateTime decideDt;
        private String statusCd;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Attach {
        private String fileId;
        private String fileNm;
        private String size;        // '842KB', '3.1MB'
    }
}
