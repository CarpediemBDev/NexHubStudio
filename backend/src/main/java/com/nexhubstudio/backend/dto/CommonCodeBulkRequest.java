package com.nexhubstudio.backend.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class CommonCodeBulkRequest {
    private List<CommonCodeRequest> created;
    private List<CommonCodeRequest> updated;
    private List<CommonCodeRequest> deleted;
}
