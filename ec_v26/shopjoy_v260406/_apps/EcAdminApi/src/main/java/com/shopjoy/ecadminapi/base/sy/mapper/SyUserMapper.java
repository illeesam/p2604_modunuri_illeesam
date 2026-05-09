package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyUserMapper {

    /** 단건조회 */
    SyUserDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyUserDto.Item> selectList(SyUserDto.Request req);

    /** 페이징조회 */
    List<SyUserDto.Item> selectPageList(SyUserDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyUserDto.Request req);

    /** 수정 */
    int updateSelective(SyUser entity);
}
