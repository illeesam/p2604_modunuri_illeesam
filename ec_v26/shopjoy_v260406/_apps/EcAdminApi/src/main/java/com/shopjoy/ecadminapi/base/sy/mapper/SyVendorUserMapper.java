package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyVendorUserMapper {

    SyVendorUserDto selectById(@Param("id") String id);

    List<SyVendorUserDto> selectList(@Param("p") Map<String, Object> p);

    List<SyVendorUserDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyVendorUser entity);
}
