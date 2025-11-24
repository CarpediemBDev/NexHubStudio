package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.CommonCodeGroup;
import com.nexhubstudio.backend.dto.CommonCodeGroupRequest;
import com.nexhubstudio.backend.exception.BusinessException;
import com.nexhubstudio.backend.exception.ErrorCode;
import com.nexhubstudio.backend.mapper.CommonCodeGroupMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommonCodeGroupService {
    private final CommonCodeGroupMapper commonCodeGroupMapper;

    public CommonCodeGroupService(CommonCodeGroupMapper commonCodeGroupMapper) {
        this.commonCodeGroupMapper = commonCodeGroupMapper;
    }

    public List<CommonCodeGroup> getAllGroups() {
        return commonCodeGroupMapper.findAll();
    }

    public CommonCodeGroup getGroupById(Long id) {
        CommonCodeGroup group = commonCodeGroupMapper.findById(id);
        if (group == null) {
            throw new BusinessException(ErrorCode.CODE_GROUP_NOT_FOUND);
        }
        return group;
    }

    public CommonCodeGroup getGroupByCode(String groupCode) {
        CommonCodeGroup group = commonCodeGroupMapper.findByGroupCode(groupCode);
        if (group == null) {
            throw new BusinessException(ErrorCode.CODE_GROUP_NOT_FOUND);
        }
        return group;
    }

    @Transactional
    public CommonCodeGroup createGroup(CommonCodeGroupRequest request) {
        // 중복 체크
        CommonCodeGroup existing = commonCodeGroupMapper.findByGroupCode(request.getGroupCode());
        if (existing != null) {
            throw new BusinessException(ErrorCode.CODE_GROUP_ALREADY_EXISTS);
        }

        CommonCodeGroup group = new CommonCodeGroup();
        group.setGroupCode(request.getGroupCode());
        group.setGroupName(request.getGroupName());
        group.setDescription(request.getDescription());
        group.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        group.setUseYn(request.getUseYn() != null ? request.getUseYn() : "Y");
        group.setIcon(request.getIcon());
        group.setColorCode(request.getColorCode());
        group.setCategory(request.getCategory());
        group.setCreatedBy("SYSTEM");

        commonCodeGroupMapper.insert(group);
        return group;
    }

    @Transactional
    public CommonCodeGroup updateGroup(Long id, CommonCodeGroupRequest request) {
        CommonCodeGroup group = commonCodeGroupMapper.findById(id);
        if (group == null) {
            throw new BusinessException(ErrorCode.CODE_GROUP_NOT_FOUND);
        }

        group.setGroupName(request.getGroupName());
        group.setDescription(request.getDescription());
        group.setSortOrder(request.getSortOrder());
        group.setUseYn(request.getUseYn());
        group.setIcon(request.getIcon());
        group.setColorCode(request.getColorCode());
        group.setCategory(request.getCategory());
        group.setUpdatedBy("SYSTEM");

        commonCodeGroupMapper.update(group);
        return group;
    }

    @Transactional
    public void deleteGroup(Long id) {
        CommonCodeGroup group = commonCodeGroupMapper.findById(id);
        if (group == null) {
            throw new BusinessException(ErrorCode.CODE_GROUP_NOT_FOUND);
        }
        commonCodeGroupMapper.delete(id);
    }
}
