package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyNoticeMapper {

    /** 단건조회 */
    SyNoticeDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyNoticeDto.Item> selectList(SyNoticeDto.Request req);

    /** 페이징조회 */
    List<SyNoticeDto.Item> selectPageList(SyNoticeDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyNoticeDto.Request req);

    /** 수정 */
    int updateSelective(SyNotice entity);
}
