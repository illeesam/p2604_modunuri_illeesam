package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;

@Mapper
public interface SyhSendEmailLogMapper {

    /** 단건조회 */
    SyhSendEmailLogDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyhSendEmailLogDto.Item> selectList(Map<String, Object> p);

    /** 페이징조회 */
    List<SyhSendEmailLogDto.Item> selectPageList(Map<String, Object> p);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(Map<String, Object> p);

    /** 수정 */
    int updateSelective(SyhSendEmailLog entity);
}
