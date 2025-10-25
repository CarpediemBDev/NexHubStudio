package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.User;
import com.nexhubstudio.backend.dto.UserDto;
import com.nexhubstudio.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Optional<UserDto> getUserById(String userId) {
        return userRepository.findById(userId).map(this::toDto);
    }

    // Entity → DTO 변환
    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setDept(user.getDept());
        dto.setRole(user.getRole());
        dto.setEmail(user.getEmail());
        dto.setEnabled(user.getEnabled());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
