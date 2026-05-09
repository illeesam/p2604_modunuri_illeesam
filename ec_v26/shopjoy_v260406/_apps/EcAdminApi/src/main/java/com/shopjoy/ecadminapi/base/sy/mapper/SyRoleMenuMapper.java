package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyRoleMenuMapper {

    /** 단건조회 */
    SyRoleMenuDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyRoleMenuDto.Item> selectList(SyRoleMenuDto.Request req);

    /** 페이징조회 */
    List<SyRoleMenuDto.Item> selectPageList(SyRoleMenuDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyRoleMenuDto.Request req);

    /** 수정 */
    int updateSelective(SyRoleMenu entity);
}
