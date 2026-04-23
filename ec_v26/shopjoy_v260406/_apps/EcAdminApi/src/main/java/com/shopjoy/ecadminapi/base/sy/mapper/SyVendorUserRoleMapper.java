package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyVendorUserRoleMapper {

    SyVendorUserRoleDto selectById(@Param("id") String id);

    List<SyVendorUserRoleDto> selectList(@Param("p") Map<String, Object> p);

    List<SyVendorUserRoleDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyVendorUserRole entity);
}
