package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyMenuMapper {

    /** 단건조회 */
    SyMenuDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyMenuDto.Item> selectList(SyMenuDto.Request req);

    /** 페이징조회 */
    List<SyMenuDto.Item> selectPageList(SyMenuDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyMenuDto.Request req);

    /** 수정 */
    int updateSelective(SyMenu entity);
}
