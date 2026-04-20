package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyBrandMapper {

    SyBrandDto selectById(@Param("id") String id);

    List<SyBrandDto> selectList(@Param("p") Map<String, Object> p);

    List<SyBrandDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyBrand entity);
}
