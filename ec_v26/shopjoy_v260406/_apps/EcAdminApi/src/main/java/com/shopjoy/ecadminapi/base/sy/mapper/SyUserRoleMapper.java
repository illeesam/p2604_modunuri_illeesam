package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyUserRoleMapper {

    SyUserRoleDto selectById(@Param("id") String id);

    List<SyUserRoleDto> selectByUserId(@Param("userId") String userId);

    List<SyUserRoleDto> selectList(Map<String, Object> p);

    List<SyUserRoleDto> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(SyUserRole entity);
}
