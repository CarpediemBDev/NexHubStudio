package com.nexhubstudio.backend.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class CommonCode {
    private Long id; // 자동증가 ID
    private Long codeGroupId; // 코드 그룹 ID (common_code_group.id 참조)
    private String codeId; // 코드 식별자 (예: ADMIN, USER 등)
    private String codeName; // 코드명 (예: 관리자, 사용자 등)
    private Integer sortOrder; // 정렬 순서
    private String useYn; // 사용 여부 (Y/N)
    private String description; // 설명
    // 메타데이터
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
    private Long parentId; // 부모 코드 ID (트리 구조용)
}
