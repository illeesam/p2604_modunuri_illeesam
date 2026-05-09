package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyVocMapper {

    /** 단건조회 */
    SyVocDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyVocDto.Item> selectList(SyVocDto.Request req);

    /** 페이징조회 */
    List<SyVocDto.Item> selectPageList(SyVocDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyVocDto.Request req);

    /** 수정 */
    int updateSelective(SyVoc entity);
}
