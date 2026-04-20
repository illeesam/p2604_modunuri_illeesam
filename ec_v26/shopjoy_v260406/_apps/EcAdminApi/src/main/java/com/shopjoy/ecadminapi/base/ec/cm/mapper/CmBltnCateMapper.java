package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnCate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBltnCateMapper {

    CmBltnCateDto selectById(@Param("id") String id);

    List<CmBltnCateDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBltnCateDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBltnCate entity);
}
