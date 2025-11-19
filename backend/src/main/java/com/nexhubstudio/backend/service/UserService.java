package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.User;
import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.dto.UserBulkRequest;
import com.nexhubstudio.backend.dto.UserResponse;
import com.nexhubstudio.backend.exception.BusinessException;
import com.nexhubstudio.backend.exception.ErrorCode;
import com.nexhubstudio.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    /**
     * 사용자 생성
     * 실패 케이스: userId 또는 name이 null/empty인 경우
     */
    public int createUser(UserRequest userRequest) {
        // 유효성 검증
        if (userRequest.getUserId() == null || userRequest.getUserId().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.USER_ID_REQUIRED);
        }
        if (userRequest.getName() == null || userRequest.getName().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.USER_NAME_REQUIRED);
        }

        // 중복 체크
        User existingUser = userMapper.findById(userRequest.getUserId());
        if (existingUser != null) {
            throw new BusinessException(ErrorCode.USER_ALREADY_EXISTS,
                    "이미 존재하는 사용자입니다: " + userRequest.getUserId());
        }

        return userMapper.insertUser(userRequest);
    }

    /**
     * 사용자 수정
     * 실패 케이스: 존재하지 않는 사용자 수정 시도
     */
    public int updateUser(UserRequest userRequest) {
        if (userRequest.getUserId() == null || userRequest.getUserId().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.USER_ID_REQUIRED);
        }

        // 존재 여부 확인
        User existingUser = userMapper.findById(userRequest.getUserId());
        if (existingUser == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND,
                    "수정할 사용자를 찾을 수 없습니다: " + userRequest.getUserId());
        }

        int result = userMapper.updateUser(userRequest);

        if (result == 0) {
            throw new BusinessException(ErrorCode.USER_UPDATE_FAILED);
        }

        return result;
    }

    /**
     * 사용자 삭제
     * 실패 케이스: 존재하지 않는 사용자 삭제 시도
     */
    public int deleteUser(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.USER_ID_REQUIRED);
        }

        // 존재 여부 확인
        User existingUser = userMapper.findById(userId);
        if (existingUser == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND,
                    "삭제할 사용자를 찾을 수 없습니다: " + userId);
        }

        int result = userMapper.deleteUser(userId);

        if (result == 0) {
            throw new BusinessException(ErrorCode.USER_DELETE_FAILED);
        }

        return result;
    }

    public List<UserResponse> getAllUsers() {
        return userMapper.findAllAsResponse();
    }

    /**
     * 사용자 조회 (ID로)
     * 실패 케이스: 존재하지 않는 사용자 조회 시 예외 발생
     */
    public UserResponse getUserById(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.USER_ID_REQUIRED);
        }

        UserResponse response = userMapper.findByIdAsResponse(userId);
        if (response == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND,
                    "사용자를 찾을 수 없습니다: " + userId);
        }
        return response;
    }

    @Transactional
    public int[] bulkSave(UserBulkRequest bulk) {
        int createdCount = 0;
        int updatedCount = 0;
        int deletedCount = 0;

        if (bulk.getCreated() != null) {
            for (UserRequest req : bulk.getCreated()) {
                createdCount += userMapper.insertUser(req);
            }
        }
        if (bulk.getUpdated() != null) {
            for (UserRequest req : bulk.getUpdated()) {
                updatedCount += userMapper.updateUser(req);
            }
        }
        if (bulk.getDeleted() != null) {
            for (UserRequest req : bulk.getDeleted()) {
                if (req.getUserId() != null) {
                    deletedCount += userMapper.deleteUser(req.getUserId());
                }
            }
        }
        return new int[] { createdCount, updatedCount, deletedCount };
    }

    /**
     * 평문 비밀번호 비교 (실제 환경에서는 반드시 암호화/해시 비교 필요!)
     * 실패 케이스: 사용자 없음 또는 비밀번호 불일치
     */
    public boolean checkPassword(String userId, String password) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.USER_ID_REQUIRED);
        }
        if (password == null || password.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "비밀번호는 필수입니다.");
        }

        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        if (!password.equals(user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        return true;
    }
}
