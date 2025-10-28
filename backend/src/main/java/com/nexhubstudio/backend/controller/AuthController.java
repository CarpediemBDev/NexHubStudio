package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.security.JwtProvider;
import com.nexhubstudio.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private UserService userService;
    @Autowired
    private JwtProvider jwtProvider;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody UserRequest userRequest) {
        var user = userService.getUserById(userRequest.getUserId());
        if (user.isEmpty() || !userService.checkPassword(userRequest.getUserId(), userRequest.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userRequest.getUserId());
        claims.put("name", userRequest.getName());
        // 필요시 추가 claims
        String token = jwtProvider.createToken(claims, userRequest.getUserId());
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        return result;
    }
}