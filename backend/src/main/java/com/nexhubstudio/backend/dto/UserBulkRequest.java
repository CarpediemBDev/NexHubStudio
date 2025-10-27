package com.nexhubstudio.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class UserBulkRequest {
    private List<UserRequest> created;
    private List<UserRequest> updated;
    private List<UserRequest> deleted;
}

