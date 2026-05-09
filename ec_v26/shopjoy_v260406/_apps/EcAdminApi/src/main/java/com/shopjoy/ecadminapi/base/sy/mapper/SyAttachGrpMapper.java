package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyAttachGrpMapper {

    /** 단건조회 */
    SyAttachGrpDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyAttachGrpDto.Item> selectList(SyAttachGrpDto.Request req);

    /** 페이징조회 */
    List<SyAttachGrpDto.Item> selectPageList(SyAttachGrpDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyAttachGrpDto.Request req);

    /** 수정 */
    int updateSelective(SyAttachGrp entity);
}
