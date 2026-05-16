package com.shopjoy.ecadminapi.base.zz.mapper;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExmy2;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ZzExmy2Mapper {

    /** 단건 조회 (복합 PK) */
    ZzExmy2Dto.Item selectById(@Param("exmy1Id") String exmy1Id,
                               @Param("exmy2Id") String exmy2Id);

    /** 전체 목록 */
    List<ZzExmy2Dto.Item> selectList(ZzExmy2Dto.Request search);

    /** 페이지 목록 */
    List<ZzExmy2Dto.Item> selectPageList(ZzExmy2Dto.Request search);

    /** 페이지 건수 */
    long selectPageCount(ZzExmy2Dto.Request search);

    int insert(ZzExmy2 entity);

    int update(ZzExmy2 entity);

    int updateSelective(ZzExmy2 entity);

    int delete(@Param("exmy1Id") String exmy1Id,
               @Param("exmy2Id") String exmy2Id);
}
