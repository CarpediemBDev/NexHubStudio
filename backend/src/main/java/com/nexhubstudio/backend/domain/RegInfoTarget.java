package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 규제 적용 대상 (reg_info_target)
 * 사업부·제품군·제품·권역·국가 멀티셀렉트를 target_type 으로 한 테이블에 둔다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegInfoTarget {
    private Long regInfoId;
    private String targetType;      // DIVISION, PRODUCT_GROUP, PRODUCT, REGION, COUNTRY
    private String targetCd;
    private Integer levelNo;        // GEO: 권역1 > 국가2, ORG: 사업부1 > 제품군2 > 제품3
    private String excludeYn;
}
