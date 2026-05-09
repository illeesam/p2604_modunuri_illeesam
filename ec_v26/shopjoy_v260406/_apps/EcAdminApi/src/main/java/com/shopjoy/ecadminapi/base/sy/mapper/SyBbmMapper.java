package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;

@Mapper
public interface SyBbmMapper {

    /** 단건조회 */
    SyBbmDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyBbmDto.Item> selectList(Map<String, Object> p);

    /** 페이징조회 */
    List<SyBbmDto.Item> selectPageList(Map<String, Object> p);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(Map<String, Object> p);

    /** 수정 */
    int updateSelective(SyBbm entity);
}
