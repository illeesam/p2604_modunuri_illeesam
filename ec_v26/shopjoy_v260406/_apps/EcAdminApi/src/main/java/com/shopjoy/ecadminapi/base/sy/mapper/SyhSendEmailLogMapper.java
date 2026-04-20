package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyhSendEmailLogMapper {

    SyhSendEmailLogDto selectById(@Param("id") String id);

    List<SyhSendEmailLogDto> selectList(@Param("p") Map<String, Object> p);

    List<SyhSendEmailLogDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyhSendEmailLog entity);
}
