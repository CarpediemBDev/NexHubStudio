package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.dto.UserBulkRequest;
import com.nexhubstudio.backend.dto.UserResponse;
import com.nexhubstudio.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.nexhubstudio.backend.dto.ApiResponse;
import java.util.List;
import java.util.Map;

/**
 * 사용자 관리 컨트롤러
 * GlobalExceptionHandler가 예외를 처리하므로 try-catch 불필요
 */
@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 사용자 생성
     * 성공: 201 Created, 사용자 정보 반환
     * 실패: 400 Bad Request (필수값 누락, 중복 사용자)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Integer>> createUser(@RequestBody UserRequest userRequest) {
        int result = userService.createUser(userRequest);
        return ResponseEntity.ok(ApiResponse.success("사용자 등록 성공", result));
    }

    /**
     * 사용자 수정
     * 성공: 200 OK
     * 실패: 404 Not Found (사용자 없음)
     */
    @PutMapping
    public ResponseEntity<ApiResponse<Integer>> updateUser(@RequestBody UserRequest userRequest) {
        int result = userService.updateUser(userRequest);
        return ResponseEntity.ok(ApiResponse.success("사용자 수정 성공", result));
    }

    /**
     * 사용자 삭제
     * 성공: 200 OK
     * 실패: 404 Not Found (사용자 없음)
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Integer>> deleteUser(@PathVariable String userId) {
        int result = userService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success("사용자 삭제 성공", result));
    }

    /**
     * 전체 사용자 조회
     * 성공: 200 OK, 사용자 목록 반환
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * 사용자 조회 (ID로)
     * 성공: 200 OK, 사용자 정보 반환
     * 실패: 404 Not Found (사용자 없음)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String userId) {
        UserResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> bulkSave(@RequestBody UserBulkRequest bulk) {
        int[] counts = userService.bulkSave(bulk);
        Map<String, Integer> result = Map.of(
                "created", counts[0],
                "updated", counts[1],
                "deleted", counts[2]);
        return ResponseEntity.ok(ApiResponse.success("일괄 처리 성공", result));
    }
}
