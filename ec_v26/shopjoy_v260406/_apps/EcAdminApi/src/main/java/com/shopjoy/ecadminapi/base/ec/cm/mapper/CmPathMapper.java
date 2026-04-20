package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmPathMapper {

    CmPathDto selectById(@Param("id") String id);

    List<CmPathDto> selectList(@Param("p") Map<String, Object> p);

    List<CmPathDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmPath entity);
}
