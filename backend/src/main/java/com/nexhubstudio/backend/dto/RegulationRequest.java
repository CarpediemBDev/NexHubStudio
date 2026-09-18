package com.nexhubstudio.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 규격/규제 정보 요청 DTO
 * 모양은 프론트 src/api/regulation.js 가 보내는 payload 와 1:1 이다.
 * (목업 모드의 src/mocks/handlers/regulation.js 가 받는 것과도 같다)
 */
public class RegulationRequest {

    private RegulationRequest() {
    }

    /** POST /api/regulations — 신규/수정 저장 */
    @Data
    @NoArgsConstructor
    public static class Save {
        private Master master;
        private List<Target> targets;
        private List<Item> items;
        private List<AttachFile> attachFiles;
        private Changes changes;
        /** 저장 직전 화면이 판정한 충돌과 담당자 조치 */
        private List<ConflictDecision> decisions;
    }

    /** POST /api/regulations/expanded — 전개(행→열) 조회 */
    @Data
    @NoArgsConstructor
    public static class Expand {
        /**
         * 목록에서 이미 걸러진 레코드 ID. 비어 있으면 전체.
         * 조회인데 POST 인 이유는 조회 결과가 수천 건이면 ID 목록이 URL 길이 제한을 넘기 때문이다.
         */
        private List<Long> regInfoIds;
    }

    /** POST /api/regulations/conflict-histories — 등록 취소 시 충돌 이력만 남김 */
    @Data
    @NoArgsConstructor
    public static class ConflictHistories {
        private List<ConflictDecision> conflicts;
        private String decisionCd;
    }

    @Data
    @NoArgsConstructor
    public static class Master {
        private Long regInfoId;         // null 이면 신규
        private String title;
        private String fieldCd;
        private String markNm;
        private String authority;
        private String url;
        private String summary;
        private String statusCd;
        /** 'yyyy-MM-dd' 또는 ISO 일시 문자열. 앞 10자리만 쓴다 */
        private String effectiveDt;
    }

    @Data
    @NoArgsConstructor
    public static class Target {
        private String targetType;
        private String targetCd;
    }

    @Data
    @NoArgsConstructor
    public static class Item {
        /** 화면에서 새로 추가한 항목은 음수 id */
        private Long itemId;
        private Long parentItemId;
        private String itemTypeCd;
        private String itemCd;
        private Integer levelNo;
        private String mandatoryYn;
        private String remark;
        private Integer sortOrder;
    }

    @Data
    @NoArgsConstructor
    public static class AttachFile {
        /** 실제 업로드된 파일이면 files.id, 화면 데모로 추가한 것은 'NEW-...' */
        private String fileId;
        private String fileNm;
        private String size;
    }

    @Data
    @NoArgsConstructor
    public static class Changes {
        private Boolean masterChanged;
        /** 화면 기준 id (신규 항목은 음수). 서버가 채번 결과로 옮겨 적는다 */
        private List<Long> changedItemIds;
    }

    @Data
    @NoArgsConstructor
    public static class ConflictDecision {
        private ExistRecord existRecord;
        private String conflictType;
        private MainAxis mainAxis;
        private String decisionCd;
        private String decisionNote;
        private Recommend recommend;
    }

    @Data
    @NoArgsConstructor
    public static class ExistRecord {
        private Long regInfoId;
        private String regNo;
        private Integer versionNo;
    }

    @Data
    @NoArgsConstructor
    public static class MainAxis {
        private String axisKey;
        private String newScopeTxt;
        private String existScopeTxt;
    }

    @Data
    @NoArgsConstructor
    public static class Recommend {
        private String text;
    }
}
