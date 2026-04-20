package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyVendorBrandMapper {

    SyVendorBrandDto selectById(@Param("id") String id);

    List<SyVendorBrandDto> selectList(@Param("p") Map<String, Object> p);

    List<SyVendorBrandDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyVendorBrand entity);
}
