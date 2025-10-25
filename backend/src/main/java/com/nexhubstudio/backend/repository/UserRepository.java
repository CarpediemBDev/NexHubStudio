package com.nexhubstudio.backend.repository;

import com.nexhubstudio.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);

    Optional<User> findByRefreshToken(String refreshToken);
    // 필요시 추가 쿼리 메서드 정의
}
