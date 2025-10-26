package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.User;
import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.dto.UserResponse;
import com.nexhubstudio.backend.mapper.UserDtoMapper;
import com.nexhubstudio.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
}
