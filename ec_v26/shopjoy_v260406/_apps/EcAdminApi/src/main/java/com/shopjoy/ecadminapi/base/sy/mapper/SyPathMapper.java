package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyPathMapper {

    /** 단건조회 */
    SyPathDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyPathDto.Item> selectList(SyPathDto.Request req);

    /** 페이징조회 */
    List<SyPathDto.Item> selectPageList(SyPathDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyPathDto.Request req);

    /** 수정 */
    int updateSelective(SyPath entity);
}
