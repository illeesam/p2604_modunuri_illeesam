package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyVendorBrandMapper {

    /** 단건조회 */
    SyVendorBrandDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyVendorBrandDto.Item> selectList(SyVendorBrandDto.Request req);

    /** 페이징조회 */
    List<SyVendorBrandDto.Item> selectPageList(SyVendorBrandDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyVendorBrandDto.Request req);

    /** 수정 */
    int updateSelective(SyVendorBrand entity);
}
