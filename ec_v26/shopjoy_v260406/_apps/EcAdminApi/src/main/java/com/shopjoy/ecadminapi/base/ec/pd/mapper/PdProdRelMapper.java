package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdProdRelMapper {

    PdProdRelDto selectById(@Param("id") String id);

    List<PdProdRelDto> selectList(@Param("p") Map<String, Object> p);

    List<PdProdRelDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PdProdRel entity);
}
