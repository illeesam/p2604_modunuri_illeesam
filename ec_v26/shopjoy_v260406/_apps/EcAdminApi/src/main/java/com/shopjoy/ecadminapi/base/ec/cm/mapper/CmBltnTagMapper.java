package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBltnTagMapper {

    CmBltnTagDto selectById(@Param("id") String id);

    List<CmBltnTagDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBltnTagDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBltnTag entity);
}
