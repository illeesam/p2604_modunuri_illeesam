package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;

@Mapper
public interface SyUserRoleMapper {

    /** 단건조회 */
    SyUserRoleDto.Item selectById(@Param("id") String id);

    /** userId 기준 조회 */
    List<SyUserRoleDto.Item> selectByUserId(@Param("userId") String userId);

    /** 목록조회 */
    List<SyUserRoleDto.Item> selectList(Map<String, Object> p);

    /** 페이징조회 */
    List<SyUserRoleDto.Item> selectPageList(Map<String, Object> p);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(Map<String, Object> p);

    /** 수정 */
    int updateSelective(SyUserRole entity);
}
