package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.User;
import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.dto.UserBulkRequest;
import com.nexhubstudio.backend.dto.UserResponse;
import com.nexhubstudio.backend.mapper.UserDtoMapper;
import com.nexhubstudio.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private UserDtoMapper userDtoMapper;

    public int createUser(UserRequest userRequest) {
        User user = userDtoMapper.toEntity(userRequest);
        return userMapper.insertUser(user);
    }

    public int updateUser(UserRequest userRequest) {
        User user = userDtoMapper.toEntity(userRequest);
        return userMapper.updateUser(user);
    }

    public int deleteUser(String userId) {
        return userMapper.deleteUser(userId);
    }

    public List<UserResponse> getAllUsers() {
        return userMapper.findAll().stream()
                .map(userDtoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public Optional<UserResponse> getUserById(String userId) {
        User user = userMapper.findById(userId);
        return Optional.ofNullable(user).map(userDtoMapper::toResponse);
    }

    @Transactional
    public int[] bulkSave(UserBulkRequest bulk) {
        int createdCount = 0;
        int updatedCount = 0;
        int deletedCount = 0;

        if (bulk.getCreated() != null) {
            for (UserRequest req : bulk.getCreated()) {
                User user = userDtoMapper.toEntity(req);
                createdCount += userMapper.insertUser(user);
            }
        }
        if (bulk.getUpdated() != null) {
            for (UserRequest req : bulk.getUpdated()) {
                User user = userDtoMapper.toEntity(req);
                updatedCount += userMapper.updateUser(user);
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
     */
    public boolean checkPassword(String userId, String password) {
        User user = userMapper.findById(userId);
        if (user == null)
            return false;
        return password != null && password.equals(user.getPassword());
    }
}
