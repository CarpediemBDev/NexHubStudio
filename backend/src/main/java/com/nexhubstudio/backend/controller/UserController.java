package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.dto.UserBulkRequest;
import com.nexhubstudio.backend.dto.UserResponse;
import com.nexhubstudio.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.nexhubstudio.backend.dto.ApiResponse;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<Integer>> createUser(@RequestBody UserRequest userRequest) {
        int result = userService.createUser(userRequest);
        ApiResponse<Integer> body = ApiResponse.<Integer>builder()
                .code(200)
                .message("사용자 등록 성공")
                .data(result)
                .build();
        return ResponseEntity.ok(body);
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Integer>> updateUser(@RequestBody UserRequest userRequest) {
        int result = userService.updateUser(userRequest);
        ApiResponse<Integer> body = ApiResponse.<Integer>builder()
                .code(200)
                .message("사용자 수정 성공")
                .data(result)
                .build();
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Integer>> deleteUser(@PathVariable String userId) {
        int result = userService.deleteUser(userId);
        ApiResponse<Integer> body = ApiResponse.<Integer>builder()
                .code(200)
                .message("사용자 삭제 성공")
                .data(result)
                .build();
        return ResponseEntity.ok(body);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        ApiResponse<List<UserResponse>> body = ApiResponse.<List<UserResponse>>builder()
                .code(200)
                .message("사용자 목록 조회 성공")
                .data(users)
                .build();
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String userId) {
        Optional<UserResponse> userOpt = userService.getUserById(userId);
        if (userOpt.isPresent()) {
            ApiResponse<UserResponse> body = ApiResponse.<UserResponse>builder()
                    .code(200)
                    .message("사용자 조회 성공")
                    .data(userOpt.get())
                    .build();
            return ResponseEntity.ok(body);
        } else {
            ApiResponse<UserResponse> body = ApiResponse.<UserResponse>builder()
                    .code(404)
                    .message("사용자를 찾을 수 없습니다.")
                    .data(null)
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> bulkSave(@RequestBody UserBulkRequest bulk) {
        int[] counts = userService.bulkSave(bulk);
        Map<String, Integer> result = Map.of(
                "created", counts[0],
                "updated", counts[1],
                "deleted", counts[2]);
        ApiResponse<Map<String, Integer>> body = ApiResponse.<Map<String, Integer>>builder()
                .code(200)
                .message("일괄 처리 성공")
                .data(result)
                .build();
        return ResponseEntity.ok(body);
    }
}
