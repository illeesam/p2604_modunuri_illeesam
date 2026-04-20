package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyhBatchHistMapper {

    SyhBatchHistDto selectById(@Param("id") String id);

    List<SyhBatchHistDto> selectList(@Param("p") Map<String, Object> p);

    List<SyhBatchHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyhBatchHist entity);
}
