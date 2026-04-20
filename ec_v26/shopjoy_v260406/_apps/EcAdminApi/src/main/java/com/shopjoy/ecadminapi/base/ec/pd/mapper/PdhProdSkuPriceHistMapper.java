package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdhProdSkuPriceHistMapper {

    PdhProdSkuPriceHistDto selectById(@Param("id") String id);

    List<PdhProdSkuPriceHistDto> selectList(@Param("p") Map<String, Object> p);

    List<PdhProdSkuPriceHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PdhProdSkuPriceHist entity);
}
