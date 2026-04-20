package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltn;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBltnMapper {

    CmBltnDto selectById(@Param("id") String id);

    List<CmBltnDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBltnDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBltn entity);
}
