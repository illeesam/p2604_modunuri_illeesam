package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;

@Mapper
public interface SyDeptMapper {

    /** 단건조회 */
    SyDeptDto.Item selectById(@Param("id") String id);

    /** 트리조회 */
    List<SyDeptDto.Item> selectTree();

    /** 목록조회 */
    List<SyDeptDto.Item> selectList(Map<String, Object> p);

    /** 페이징조회 */
    List<SyDeptDto.Item> selectPageList(Map<String, Object> p);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(Map<String, Object> p);

    /** 수정 */
    int updateSelective(SyDept entity);
}
