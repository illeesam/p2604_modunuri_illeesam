package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyTemplateMapper {

    /** 단건조회 */
    SyTemplateDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyTemplateDto.Item> selectList(SyTemplateDto.Request req);

    /** 페이징조회 */
    List<SyTemplateDto.Item> selectPageList(SyTemplateDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyTemplateDto.Request req);

    /** 수정 */
    int updateSelective(SyTemplate entity);
}
