package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface UserMapper {
    List<User> findAll();

    User findById(@Param("userId") String userId);

    int insertUser(User user);

    int updateUser(User user);

    int deleteUser(@Param("userId") String userId);
}
