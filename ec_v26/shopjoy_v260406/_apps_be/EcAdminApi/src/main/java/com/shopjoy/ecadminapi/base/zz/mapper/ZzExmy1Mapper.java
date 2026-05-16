package com.shopjoy.ecadminapi.base.zz.mapper;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExmy1;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ZzExmy1Mapper {

    /** 단건 조회 */
    ZzExmy1Dto.Item selectById(@Param("exmy1Id") String exmy1Id);

    /** 전체 목록 */
    List<ZzExmy1Dto.Item> selectList(ZzExmy1Dto.Request search);

    /** 페이지 목록 */
    List<ZzExmy1Dto.Item> selectPageList(ZzExmy1Dto.Request search);

    /** 페이지 건수 */
    long selectPageCount(ZzExmy1Dto.Request search);

    int insert(ZzExmy1 entity);

    int update(ZzExmy1 entity);

    int updateSelective(ZzExmy1 entity);

    int delete(@Param("exmy1Id") String exmy1Id);
}
