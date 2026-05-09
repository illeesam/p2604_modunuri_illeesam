package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyVendorMapper {

    /** 단건조회 */
    SyVendorDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyVendorDto.Item> selectList(SyVendorDto.Request req);

    /** 페이징조회 */
    List<SyVendorDto.Item> selectPageList(SyVendorDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyVendorDto.Request req);

    /** 수정 */
    int updateSelective(SyVendor entity);
}
