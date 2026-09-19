package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 규제 코드 한 건 — common_code 에서 규제 그룹만 뽑아 본 모습.
 *
 * DB 는 계층을 parent_id(대리키 자기참조)로 들고 있지만, 이 도메인은 상위를 코드로 본다.
 * 충돌 판정이 다루는 값이 전부 코드이기 때문이다 —
 * reg_info_target.target_cd, reg_info_item.item_cd 가 varchar 코드이고,
 * leafScope 가 "유럽" -&gt; {FR, DE, IT...} 로 펼칠 때도 코드로 내려간다.
 * 대리키를 그대로 노출하면 판정 코드가 매번 id↔code 를 오가며 조인해야 한다.
 *
 * groupCode 는 reg_info_target.target_type / reg_info_item.item_type_cd 값과 같다
 * (REGION, COUNTRY, DIVISION, PRODUCT_GROUP, PRODUCT, REGULATION, STANDARD, CERT, FIELD).
 * 타입에서 그룹을 바로 유도할 수 있어 매핑표가 필요 없다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegCode {
    /** 축 구분. target_type / item_type_cd 와 같은 값 */
    private String groupCode;
    private String code;
    private String name;
    /** 상위 코드. 최상위면 null */
    private String parentCode;
    private Integer sortOrder;
}
