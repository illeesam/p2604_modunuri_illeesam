package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SyhAccessErrorLogMapper {

    /** 페이징조회 */
    List<SyhAccessErrorLogDto.Item> selectPageList(SyhAccessErrorLogDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyhAccessErrorLogDto.Request req);
}
