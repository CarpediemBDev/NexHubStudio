package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.User;
import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.dto.UserResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface UserMapper {
    List<User> findAll();

    List<UserResponse> findAllAsResponse();

    User findById(@Param("userId") String userId);

    UserResponse findByIdAsResponse(@Param("userId") String userId);

    int insertUser(UserRequest request);

    int updateUser(UserRequest request);

    int deleteUser(@Param("userId") String userId);
}
