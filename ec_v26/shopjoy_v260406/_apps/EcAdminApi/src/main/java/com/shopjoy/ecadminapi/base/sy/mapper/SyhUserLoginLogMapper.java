package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyhUserLoginLogMapper {

    /** 단건조회 */
    SyhUserLoginLogDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyhUserLoginLogDto.Item> selectList(SyhUserLoginLogDto.Request req);

    /** 페이징조회 */
    List<SyhUserLoginLogDto.Item> selectPageList(SyhUserLoginLogDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyhUserLoginLogDto.Request req);

    /** 수정 */
    int updateSelective(SyhUserLoginLog entity);
}
