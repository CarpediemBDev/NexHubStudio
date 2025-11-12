package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.dto.UserResponse;
import com.nexhubstudio.backend.security.JwtProvider;
import com.nexhubstudio.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 인증 관련 컨트롤러
 * 로그인, 토큰 발급 등
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;
    @Autowired
    private JwtProvider jwtProvider;

    /**
     * 로그인
     * 성공: 200 OK, JWT 토큰 반환
     * 실패: 401 Unauthorized (사용자 없음 또는 비밀번호 불일치)
     */
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody UserRequest userRequest) {
        // 사용자 조회 (없으면 BusinessException 발생)
        UserResponse user = userService.getUserById(userRequest.getUserId());

        // 비밀번호 체크 (틀리면 BusinessException 발생)
        userService.checkPassword(userRequest.getUserId(), userRequest.getPassword());

        // JWT 토큰 생성
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("name", user.getName());
        claims.put("role", user.getRole());

        String token = jwtProvider.createToken(claims, user.getUserId());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", user);
        return result;
    }
}