package com.nexhubstudio.backend.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class CommonCodeRequest {
    private Long id;
    private Long codeGroupId;
    private String codeId;
    private String codeName;
    private Integer sortOrder;
    private String useYn;
    private String description;
    private Long parentId; // 부모 코드 ID (트리 구조용)
}
