package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;

@Mapper
public interface SyI18nMsgMapper {

    /** 단건조회 */
    SyI18nMsgDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyI18nMsgDto.Item> selectList(Map<String, Object> p);

    /** 페이징조회 */
    List<SyI18nMsgDto.Item> selectPageList(Map<String, Object> p);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(Map<String, Object> p);

    /** 수정 */
    int updateSelective(SyI18nMsg entity);
}
