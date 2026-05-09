package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyI18nMapper {

    /** 단건조회 */
    SyI18nDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyI18nDto.Item> selectList(SyI18nDto.Request req);

    /** 페이징조회 */
    List<SyI18nDto.Item> selectPageList(SyI18nDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyI18nDto.Request req);

    /** 수정 */
    int updateSelective(SyI18n entity);
}
