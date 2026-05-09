package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyAttachMapper {

    /** 단건조회 */
    SyAttachDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyAttachDto.Item> selectList(SyAttachDto.Request req);

    /** 페이징조회 */
    List<SyAttachDto.Item> selectPageList(SyAttachDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyAttachDto.Request req);

    /** 수정 */
    int updateSelective(SyAttach entity);
}
