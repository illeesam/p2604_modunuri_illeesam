package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyVendorContentMapper {

    /** 단건조회 */
    SyVendorContentDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyVendorContentDto.Item> selectList(SyVendorContentDto.Request req);

    /** 페이징조회 */
    List<SyVendorContentDto.Item> selectPageList(SyVendorContentDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyVendorContentDto.Request req);

    /** 수정 */
    int updateSelective(SyVendorContent entity);
}
