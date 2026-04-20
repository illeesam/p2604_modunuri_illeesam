package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdCategoryProdMapper {

    PdCategoryProdDto selectById(@Param("id") String id);

    List<PdCategoryProdDto> selectList(@Param("p") Map<String, Object> p);

    List<PdCategoryProdDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PdCategoryProd entity);
}
