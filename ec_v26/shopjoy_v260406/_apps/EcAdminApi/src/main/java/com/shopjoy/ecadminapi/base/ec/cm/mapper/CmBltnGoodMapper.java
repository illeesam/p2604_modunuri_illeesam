package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnGood;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBltnGoodMapper {

    CmBltnGoodDto selectById(@Param("id") String id);

    List<CmBltnGoodDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBltnGoodDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBltnGood entity);
}
