package com.shopjoy.ecadminapi.base.zz.mapper;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExmy3;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ZzExmy3Mapper {

    /** 단건 조회 (복합 PK) */
    ZzExmy3Dto.Item selectById(@Param("exmy1Id") String exmy1Id,
                               @Param("exmy2Id") String exmy2Id,
                               @Param("exmy3Id") String exmy3Id);

    /** 전체 목록 */
    List<ZzExmy3Dto.Item> selectList(ZzExmy3Dto.Request search);

    /** 페이지 목록 */
    List<ZzExmy3Dto.Item> selectPageList(ZzExmy3Dto.Request search);

    /** 페이지 건수 */
    long selectPageCount(ZzExmy3Dto.Request search);

    int insert(ZzExmy3 entity);

    int update(ZzExmy3 entity);

    int updateSelective(ZzExmy3 entity);

    int delete(@Param("exmy1Id") String exmy1Id,
               @Param("exmy2Id") String exmy2Id,
               @Param("exmy3Id") String exmy3Id);
}
