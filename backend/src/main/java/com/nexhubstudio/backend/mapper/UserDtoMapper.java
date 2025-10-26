package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.User;
import com.nexhubstudio.backend.dto.UserRequest;
import com.nexhubstudio.backend.dto.UserResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserDtoMapper {
    User toEntity(UserRequest dto);
    UserResponse toResponse(User entity);
}
