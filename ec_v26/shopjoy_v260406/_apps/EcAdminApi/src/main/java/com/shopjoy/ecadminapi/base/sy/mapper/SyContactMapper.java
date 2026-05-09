package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyContactMapper {

    /** 단건조회 */
    SyContactDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyContactDto.Item> selectList(SyContactDto.Request req);

    /** 페이징조회 */
    List<SyContactDto.Item> selectPageList(SyContactDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyContactDto.Request req);

    /** 수정 */
    int updateSelective(SyContact entity);
}
