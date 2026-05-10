package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;

@Mapper
public interface SyCodeMapper {

    /** 단건조회 */
    SyCodeDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyCodeDto.Item> selectList(Map<String, Object> p);

    /** 페이징조회 */
    List<SyCodeDto.Item> selectPageList(Map<String, Object> p);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(Map<String, Object> p);

    /** 수정 */
    int updateSelective(SyCode entity);
}
