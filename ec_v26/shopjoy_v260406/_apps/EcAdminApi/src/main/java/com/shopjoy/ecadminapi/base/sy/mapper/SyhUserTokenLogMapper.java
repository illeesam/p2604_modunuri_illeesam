package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyhUserTokenLogMapper {

    /** 단건조회 */
    SyhUserTokenLogDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyhUserTokenLogDto.Item> selectList(SyhUserTokenLogDto.Request req);

    /** 페이징조회 */
    List<SyhUserTokenLogDto.Item> selectPageList(SyhUserTokenLogDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyhUserTokenLogDto.Request req);

    /** 수정 */
    int updateSelective(SyhUserTokenLog entity);
}
