package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyhUserTokenLogMapper {

    SyhUserTokenLogDto selectById(@Param("id") String id);

    List<SyhUserTokenLogDto> selectList(@Param("p") Map<String, Object> p);

    List<SyhUserTokenLogDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyhUserTokenLog entity);
}
