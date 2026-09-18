package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 전개(행→열) 한 행 — JOIN 결과 그대로.
 *
 * 목록 화면 "전개" 탭은 한 셀에 여러 줄로 쌓이던 값(규제 &gt; 규격 &gt; 관리항목, 제품)을
 * 각각 열로 돌린다. 그 펼치기는 결국 JOIN 이라 화면이 아니라 여기서 한다.
 *
 * 코드만 담는다. 이름은 담지 않는다 —
 * reg_info_item 에는 ITEM_NM 이 없고 common_code 에도 규제 코드가 없어서
 * 백엔드에는 코드→이름 출처가 아예 없다. 이름은 화면의 코드테이블이 단독으로 쥔다.
 *
 * 사업부·제품군·권역·국가는 여기 없다. 전개 축이 아니라 레코드 속성이라
 * JOIN 에 끼우면 행이 그 개수만큼 배로 불어난다. 서비스가 따로 붙인다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegExpandRow {
    private Long regInfoId;
    private String statusCd;
    private String regNo;
    private String title;
    private String fieldCd;

    /** 정보관리항목 3단. 하위가 없는 단계는 null (LEFT JOIN) */
    private String regulationCd;
    private String standardCd;
    private String certCd;
    /** 가장 깊은 항목의 필수여부 */
    private String mandatoryYn;

    /** 제품 타겟. 미지정이면 null */
    private String productCd;

    private LocalDate effectiveDt;
    private Integer versionNo;

    /**
     * 셀 병합키. "어디까지 같아야 한 칸으로 묶느냐" 는 정렬 순서와 한 몸이라
     * 정렬한 쪽이 키도 만든다. 화면이 만들면 ORDER BY 를 바꾸는 순간 병합이 조용히 깨진다.
     */
    private String fieldKey;
    private String recKey;
    private String ruleKey;
    private String stdKey;
}
