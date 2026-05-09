package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyBrandMapper {

    /** 단건조회 */
    SyBrandDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyBrandDto.Item> selectList(SyBrandDto.Request req);

    /** 페이징조회 */
    List<SyBrandDto.Item> selectPageList(SyBrandDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyBrandDto.Request req);

    /** 수정 */
    int updateSelective(SyBrand entity);
}
