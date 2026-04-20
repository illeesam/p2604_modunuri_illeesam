package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnFile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBltnFileMapper {

    CmBltnFileDto selectById(@Param("id") String id);

    List<CmBltnFileDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBltnFileDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBltnFile entity);
}
