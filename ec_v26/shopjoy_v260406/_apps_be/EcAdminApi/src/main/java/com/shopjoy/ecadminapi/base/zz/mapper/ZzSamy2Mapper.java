package com.shopjoy.ecadminapi.base.zz.mapper;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy2;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ZzSamy2Mapper {

    /** 단건 조회 */
    ZzSamy2Dto.Item selectById(@Param("samy2Id") String samy2Id);

    /** 전체 목록 */
    List<ZzSamy2Dto.Item> selectList(ZzSamy2Dto.Request search);

    /** 페이지 목록 */
    List<ZzSamy2Dto.Item> selectPageList(ZzSamy2Dto.Request search);

    /** 페이지 건수 */
    long selectPageCount(ZzSamy2Dto.Request search);

    int insert(ZzSamy2 entity);

    int update(ZzSamy2 entity);

    int updateSelective(ZzSamy2 entity);

    int delete(@Param("samy2Id") String samy2Id);
}
