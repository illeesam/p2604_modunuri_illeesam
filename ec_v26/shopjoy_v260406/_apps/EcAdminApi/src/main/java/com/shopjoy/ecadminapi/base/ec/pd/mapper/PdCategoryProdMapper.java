package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdCategoryProdMapper {

    PdCategoryProdDto.Item selectById(@Param("id") String id);

    List<PdCategoryProdDto.Item> selectList(PdCategoryProdDto.Request req);

    List<PdCategoryProdDto.Item> selectPageList(PdCategoryProdDto.Request req);

    long selectPageCount(PdCategoryProdDto.Request req);

    int updateSelective(PdCategoryProd entity);
}
