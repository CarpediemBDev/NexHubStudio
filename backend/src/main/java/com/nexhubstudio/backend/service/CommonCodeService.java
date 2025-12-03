package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.CommonCode;
import com.nexhubstudio.backend.domain.CommonCodeGroup;
import com.nexhubstudio.backend.dto.CommonCodeRequest;
import com.nexhubstudio.backend.dto.CommonCodeBulkRequest;
import com.nexhubstudio.backend.exception.BusinessException;
import com.nexhubstudio.backend.exception.ErrorCode;
import com.nexhubstudio.backend.mapper.CommonCodeMapper;
import com.nexhubstudio.backend.mapper.CommonCodeGroupMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommonCodeService {

    @Autowired
    private CommonCodeMapper commonCodeMapper;

    @Autowired
    private CommonCodeGroupMapper commonCodeGroupMapper;

    public int createCommonCode(CommonCodeRequest request) {
        // 코드 그룹 ID 검증 (애플리케이션 레벨)
        if (request.getCodeGroupId() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        CommonCodeGroup group = commonCodeGroupMapper.findById(request.getCodeGroupId());
        if (group == null) {
            throw new BusinessException(ErrorCode.CODE_GROUP_NOT_FOUND);
        }

        if (request.getCodeId() == null || request.getCodeId().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (request.getCodeName() == null || request.getCodeName().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        return commonCodeMapper.insertCommonCode(request);
    }

    public int updateCommonCode(CommonCodeRequest request) {
        if (request.getId() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        CommonCode existingCode = commonCodeMapper.findById(request.getId());
        if (existingCode == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        return commonCodeMapper.updateCommonCode(request);
    }

    public int deleteCommonCode(Long id) {
        if (id == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        CommonCode existingCode = commonCodeMapper.findById(id);
        if (existingCode == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        return commonCodeMapper.deleteCommonCode(id);
    }

    public List<CommonCode> getAllCommonCodes() {
        return commonCodeMapper.findAll();
    }

    public List<CommonCode> getCommonCodesByGroupId(Long codeGroupId) {
        if (codeGroupId == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        return commonCodeMapper.findByCodeGroupId(codeGroupId);
    }

    public List<CommonCode> getCommonCodesByGroupCode(String groupCode) {
        if (groupCode == null || groupCode.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        CommonCodeGroup group = commonCodeGroupMapper.findByGroupCode(groupCode);
        if (group == null) {
            throw new BusinessException(ErrorCode.CODE_GROUP_NOT_FOUND);
        }

        return commonCodeMapper.findByCodeGroupId(group.getId());
    }

    public CommonCode getCommonCodeById(Long id) {
        if (id == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        CommonCode code = commonCodeMapper.findById(id);
        if (code == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        return code;
    }

    @Transactional
    public int[] bulkSave(CommonCodeBulkRequest bulk) {
        int createdCount = 0;
        int updatedCount = 0;
        int deletedCount = 0;

        if (bulk.getCreated() != null) {
            for (CommonCodeRequest req : bulk.getCreated()) {
                createdCount += commonCodeMapper.insertCommonCode(req);
            }
        }
        if (bulk.getUpdated() != null) {
            for (CommonCodeRequest req : bulk.getUpdated()) {
                updatedCount += commonCodeMapper.updateCommonCode(req);
            }
        }
        if (bulk.getDeleted() != null) {
            for (CommonCodeRequest req : bulk.getDeleted()) {
                if (req.getId() != null) {
                    deletedCount += commonCodeMapper.deleteCommonCode(req.getId());
                }
            }
        }
        return new int[] { createdCount, updatedCount, deletedCount };
    }
}
