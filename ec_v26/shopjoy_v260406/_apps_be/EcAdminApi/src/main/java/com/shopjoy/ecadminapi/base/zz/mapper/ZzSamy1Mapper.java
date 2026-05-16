package com.shopjoy.ecadminapi.base.zz.mapper;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy1;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ZzSamy1Mapper {

    /** 단건 조회 */
    ZzSamy1Dto.Item selectById(@Param("samy1Id") String samy1Id);

    /** 전체 목록 */
    List<ZzSamy1Dto.Item> selectList(ZzSamy1Dto.Request search);

    /** 페이지 목록 */
    List<ZzSamy1Dto.Item> selectPageList(ZzSamy1Dto.Request search);

    /** 페이지 건수 */
    long selectPageCount(ZzSamy1Dto.Request search);

    int insert(ZzSamy1 entity);

    int update(ZzSamy1 entity);

    int updateSelective(ZzSamy1 entity);

    int delete(@Param("samy1Id") String samy1Id);
}
