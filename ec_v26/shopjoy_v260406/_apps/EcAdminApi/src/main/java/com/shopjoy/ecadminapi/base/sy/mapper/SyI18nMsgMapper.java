package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyI18nMsgMapper {

    SyI18nMsgDto selectById(@Param("id") String id);

    List<SyI18nMsgDto> selectList(@Param("p") Map<String, Object> p);

    List<SyI18nMsgDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyI18nMsg entity);
}
