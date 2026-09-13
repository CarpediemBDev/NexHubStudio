package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 정보관리항목 (reg_info_item)
 * 규제(1) > 규격(2) > 인증서(3) 트리. parent_item_id 자기참조.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegInfoItem {
    private Long itemId;
    private Long regInfoId;
    private Long parentItemId;
    private String itemTypeCd;      // REGULATION, STANDARD, CERT
    private String itemCd;
    private Integer levelNo;
    private String mandatoryYn;
    private String remark;
    private Integer sortOrder;
}
