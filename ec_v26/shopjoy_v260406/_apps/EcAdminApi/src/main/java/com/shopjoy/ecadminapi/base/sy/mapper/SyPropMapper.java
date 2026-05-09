package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyPropMapper {

    /** 단건조회 */
    SyPropDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyPropDto.Item> selectList(SyPropDto.Request req);

    /** 페이징조회 */
    List<SyPropDto.Item> selectPageList(SyPropDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyPropDto.Request req);

    /** 수정 */
    int updateSelective(SyProp entity);
}
