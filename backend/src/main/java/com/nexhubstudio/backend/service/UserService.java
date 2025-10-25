package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.User;
import com.nexhubstudio.backend.dto.UserDto;
import com.nexhubstudio.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    public int createUser(User user) {
        return userMapper.insertUser(user);
    }

    public int updateUser(User user) {
        return userMapper.updateUser(user);
    }

    public int deleteUser(String userId) {
        return userMapper.deleteUser(userId);
    }

    @Autowired
    private UserMapper userMapper;

    public List<UserDto> getAllUsers() {
        return userMapper.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Optional<UserDto> getUserById(String userId) {
        User user = userMapper.findById(userId);
        return Optional.ofNullable(user).map(this::toDto);
    }

    // Entity → DTO 변환
    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setDept(user.getDept());
        dto.setRole(user.getRole());
        dto.setEmail(user.getEmail());
        dto.setPassword(user.getPassword());
        dto.setPhone(user.getPhone());
        dto.setStatus(user.getStatus());
        dto.setRefreshToken(user.getRefreshToken());
        dto.setTokenExpiredAt(user.getTokenExpiredAt());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setCreatedBy(user.getCreatedBy());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedBy(user.getUpdatedBy());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
