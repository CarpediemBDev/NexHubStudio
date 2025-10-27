package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.dto.UserBulkRequest;
import com.nexhubstudio.backend.dto.UserResponse;
import com.nexhubstudio.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public int createUser(@RequestBody UserRequest userRequest) {
        return userService.createUser(userRequest);
    }

    @PutMapping
    public int updateUser(@RequestBody UserRequest userRequest) {
        return userService.updateUser(userRequest);
    }

    @DeleteMapping("/{userId}")
    public int deleteUser(@PathVariable String userId) {
        return userService.deleteUser(userId);
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{userId}")
    public Optional<UserResponse> getUserById(@PathVariable String userId) {
        return userService.getUserById(userId);
    }

    @PostMapping("/bulk")
    public java.util.Map<String, Integer> bulkSave(@RequestBody UserBulkRequest bulk) {
        int[] counts = userService.bulkSave(bulk);
        return java.util.Map.of(
                "created", counts[0],
                "updated", counts[1],
                "deleted", counts[2]
        );
    }
}
