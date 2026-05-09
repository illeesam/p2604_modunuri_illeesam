package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyVendorUserRoleMapper {

    /** 단건조회 */
    SyVendorUserRoleDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyVendorUserRoleDto.Item> selectList(SyVendorUserRoleDto.Request req);

    /** 페이징조회 */
    List<SyVendorUserRoleDto.Item> selectPageList(SyVendorUserRoleDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyVendorUserRoleDto.Request req);

    /** 수정 */
    int updateSelective(SyVendorUserRole entity);
}
