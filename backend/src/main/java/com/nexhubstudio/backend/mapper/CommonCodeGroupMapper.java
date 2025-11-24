package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.CommonCodeGroup;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CommonCodeGroupMapper {
    List<CommonCodeGroup> findAll();

    CommonCodeGroup findById(Long id);

    CommonCodeGroup findByGroupCode(String groupCode);

    int insert(CommonCodeGroup commonCodeGroup);

    int update(CommonCodeGroup commonCodeGroup);

    int delete(Long id);
}
