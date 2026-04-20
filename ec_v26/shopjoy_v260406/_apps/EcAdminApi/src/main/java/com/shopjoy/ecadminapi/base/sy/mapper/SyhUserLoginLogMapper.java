package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyhUserLoginLogMapper {

    SyhUserLoginLogDto selectById(@Param("id") String id);

    List<SyhUserLoginLogDto> selectList(@Param("p") Map<String, Object> p);

    List<SyhUserLoginLogDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyhUserLoginLog entity);
}
