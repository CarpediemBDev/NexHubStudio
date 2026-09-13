package com.nexhubstudio.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 규제 레코드에 연결된 첨부 파일 (reg_info.attach_group_id = files.file_group_id 조인 결과)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegAttachFile {
    private Long regInfoId;
    private Long fileId;
    private String originalName;
    private Long fileSize;
}
