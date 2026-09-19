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

    /**
     * POST /api/regulations/detect-conflicts — 저장 전 충돌 예측.
     * 화면이 입력하는 동안 보여주는 값이고, 저장 시에는 서버가 같은 엔진으로 다시 판정한다.
     * 모양은 프론트 detectConflicts() 결과와 맞춘다.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConflictPreview {
        private ExistRef existRecord;
        private String conflictType;
        private List<AxisDetail> axisDetails;
        private AxisDetail mainAxis;
        private Recommend recommend;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExistRef {
        private Long regInfoId;
        private String regNo;
        private String title;
        private String statusCd;
        private Integer versionNo;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AxisDetail {
        private String axisKey;
        private String axisName;
        private String relation;
        private String newScopeTxt;
        private String existScopeTxt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Recommend {
        private String decisionCd;
        private String text;
    }

    /**
     * POST /api/regulations/expanded — 전개(행→열) 결과.
     * 행 한 줄 = (레코드 × 규제 × 규격 × 관리항목 × 제품) 조합 하나.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Expanded {
        private List<ExpandedRow> rows;
        private int totalCount;
    }

    /**
     * 전개 한 행. 코드만 내린다 —
     * reg_info_item 에 ITEM_NM 이 없고 common_code 에도 규제 코드가 없어서
     * 백엔드에는 코드→이름 출처가 아예 없다. 이름은 화면 코드테이블이 붙인다.
     * 목업 핸들러(src/mocks/handlers/regulation.js 의 expandRecords)와 같은 모양이어야 한다.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExpandedRow {
        private Long regInfoId;
        private String statusCd;
        private String regNo;
        private String title;
        private String fieldCd;

        /** 정보관리항목 3단. 하위가 없는 단계는 빈 문자열 */
        private String regulationCd;
        private String standardCd;
        private String certCd;
        private String mandatoryYn;

        /** 제품 타겟. 미지정이면 빈 문자열 — 화면이 '전체' 로 읽는다 */
        private String productCd;

        /** 레코드 단위 멀티값. 전개 축이 아니라서 곱하지 않고 목록 그대로 */
        private List<String> divisionCds;
        private List<String> productGroupCds;
        private List<String> regionCds;
        private List<String> countryCds;

        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate effectiveDt;
        private Integer versionNo;

        /** 셀 병합키. 정렬한 쪽(서버)이 만든다 */
        private String fieldKey;
        private String recKey;
        private String ruleKey;
        private String stdKey;
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
