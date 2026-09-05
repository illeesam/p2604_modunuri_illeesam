package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyUserRoleMapper {

    /** userId 기준 조회 */
    List<SyUserRoleDto.Item> selectByUserId(@Param("userId") String userId);
}
