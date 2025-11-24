package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.CommonCode;
import com.nexhubstudio.backend.dto.CommonCodeRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CommonCodeMapper {
    List<CommonCode> findAll();

    List<CommonCode> findByCodeGroupId(@Param("codeGroupId") Long codeGroupId);

    CommonCode findById(@Param("id") Long id);

    int insertCommonCode(CommonCodeRequest request);

    int updateCommonCode(CommonCodeRequest request);

    int deleteCommonCode(@Param("id") Long id);
}
