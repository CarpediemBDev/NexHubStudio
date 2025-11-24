package com.nexhubstudio.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 공통코드 그룹 등록/수정 요청 DTO
 */
public class CommonCodeGroupRequest {
    @NotBlank(message = "그룹 코드는 필수입니다.")
    @Size(max = 20, message = "그룹 코드는 20자 이하여야 합니다.")
    private String groupCode;

    @NotBlank(message = "그룹명은 필수입니다.")
    @Size(max = 100, message = "그룹명은 100자 이하여야 합니다.")
    private String groupName;

    @Size(max = 500, message = "설명은 500자 이하여야 합니다.")
    private String description;

    private Integer sortOrder;

    @Pattern(regexp = "^[YN]$", message = "사용여부는 Y 또는 N이어야 합니다.")
    private String useYn;

    @Size(max = 50, message = "아이콘은 50자 이하여야 합니다.")
    private String icon;

    @Size(max = 20, message = "색상코드는 20자 이하여야 합니다.")
    private String colorCode;

    @Size(max = 50, message = "카테고리는 50자 이하여야 합니다.")
    private String category;

    // Getters and Setters
    public String getGroupCode() {
        return groupCode;
    }

    public void setGroupCode(String groupCode) {
        this.groupCode = groupCode;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getUseYn() {
        return useYn;
    }

    public void setUseYn(String useYn) {
        this.useYn = useYn;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColorCode() {
        return colorCode;
    }

    public void setColorCode(String colorCode) {
        this.colorCode = colorCode;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
