package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyhUserLoginHistMapper {

    SyhUserLoginHistDto selectById(@Param("id") String id);

    List<SyhUserLoginHistDto> selectList(@Param("p") Map<String, Object> p);

    List<SyhUserLoginHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyhUserLoginHist entity);
}
