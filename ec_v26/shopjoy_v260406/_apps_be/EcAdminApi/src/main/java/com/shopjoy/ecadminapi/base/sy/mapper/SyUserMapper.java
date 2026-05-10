package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyUserMapper {

    /** 단건조회 */
    SyUserDto.Item selectById(@Param("id") String id);

    /** 목록조회 — Map 기반 (Mapper XML 의 <if test="..."> 조건은 Map 의 missing key 를 null 로 안전 처리) */
    List<SyUserDto.Item> selectList(Map<String, Object> p);

    /** 페이징조회 */
    List<SyUserDto.Item> selectPageList(Map<String, Object> p);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(Map<String, Object> p);

    /** 수정 */
    int updateSelective(SyUser entity);
}
