package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;

@Mapper
public interface SyVendorUserMapper {

    /** 단건조회 */
    SyVendorUserDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyVendorUserDto.Item> selectList(Map<String, Object> p);

    /** 페이징조회 */
    List<SyVendorUserDto.Item> selectPageList(Map<String, Object> p);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(Map<String, Object> p);

    /** 수정 */
    int updateSelective(SyVendorUser entity);
}
