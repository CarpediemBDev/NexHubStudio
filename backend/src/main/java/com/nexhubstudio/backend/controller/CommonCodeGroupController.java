package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.domain.CommonCodeGroup;
import com.nexhubstudio.backend.dto.ApiResponse;
import com.nexhubstudio.backend.dto.CommonCodeGroupRequest;
import com.nexhubstudio.backend.service.CommonCodeGroupService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/common-code-groups")
public class CommonCodeGroupController {
    private final CommonCodeGroupService commonCodeGroupService;

    public CommonCodeGroupController(CommonCodeGroupService commonCodeGroupService) {
        this.commonCodeGroupService = commonCodeGroupService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommonCodeGroup>>> getAllGroups() {
        return ResponseEntity.ok(ApiResponse.success(commonCodeGroupService.getAllGroups()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonCodeGroup>> getGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(commonCodeGroupService.getGroupById(id)));
    }

    @GetMapping("/code/{groupCode}")
    public ResponseEntity<ApiResponse<CommonCodeGroup>> getGroupByCode(@PathVariable String groupCode) {
        return ResponseEntity.ok(ApiResponse.success(commonCodeGroupService.getGroupByCode(groupCode)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CommonCodeGroup>> createGroup(
            @Valid @RequestBody CommonCodeGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success(commonCodeGroupService.createGroup(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonCodeGroup>> updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody CommonCodeGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success(commonCodeGroupService.updateGroup(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable Long id) {
        commonCodeGroupService.deleteGroup(id);
        return ResponseEntity.ok(ApiResponse.success("삭제 완료", null));
    }
}
