package com.shopjoy.ecadminapi.base.zz.mapper;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy3;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ZzSamy3Mapper {

    /** 단건 조회 */
    ZzSamy3Dto.Item selectById(@Param("samy3Id") String samy3Id);

    /** 전체 목록 */
    List<ZzSamy3Dto.Item> selectList(ZzSamy3Dto.Request search);

    /** 페이지 목록 */
    List<ZzSamy3Dto.Item> selectPageList(ZzSamy3Dto.Request search);

    /** 페이지 건수 */
    long selectPageCount(ZzSamy3Dto.Request search);

    int insert(ZzSamy3 entity);

    int update(ZzSamy3 entity);

    int updateSelective(ZzSamy3 entity);

    int delete(@Param("samy3Id") String samy3Id);
}
