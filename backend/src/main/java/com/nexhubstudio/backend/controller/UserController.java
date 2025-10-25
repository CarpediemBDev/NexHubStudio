package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.UserDto;
import com.nexhubstudio.backend.domain.User;
import com.nexhubstudio.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    @PostMapping
    public int createUser(@RequestBody UserDto userDto) {
        // UserDto → User 변환 필요(간단 예시)
        User user = new User();
        user.setUserId(userDto.getUserId());
        user.setName(userDto.getName());
        user.setDept(userDto.getDept());
        user.setRole(userDto.getRole());
        user.setEmail(userDto.getEmail());
        user.setLastLoginAt(userDto.getLastLoginAt());
        user.setCreatedAt(userDto.getCreatedAt());
        user.setUpdatedAt(userDto.getUpdatedAt());
        return userService.createUser(user);
    }

    @PutMapping
    public int updateUser(@RequestBody UserDto userDto) {
        User user = new User();
        user.setUserId(userDto.getUserId());
        user.setName(userDto.getName());
        user.setDept(userDto.getDept());
        user.setRole(userDto.getRole());
        user.setEmail(userDto.getEmail());
        user.setLastLoginAt(userDto.getLastLoginAt());
        user.setCreatedAt(userDto.getCreatedAt());
        user.setUpdatedAt(userDto.getUpdatedAt());
        return userService.updateUser(user);
    }

    @DeleteMapping("/{userId}")
    public int deleteUser(@PathVariable String userId) {
        return userService.deleteUser(userId);
    }

    @Autowired
    private UserService userService;

    @GetMapping
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{userId}")
    public Optional<UserDto> getUserById(@PathVariable String userId) {
        return userService.getUserById(userId);
    }
}
