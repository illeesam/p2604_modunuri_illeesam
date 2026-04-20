package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdProdQnaMapper {

    PdProdQnaDto selectById(@Param("id") String id);

    List<PdProdQnaDto> selectList(@Param("p") Map<String, Object> p);

    List<PdProdQnaDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PdProdQna entity);
}
