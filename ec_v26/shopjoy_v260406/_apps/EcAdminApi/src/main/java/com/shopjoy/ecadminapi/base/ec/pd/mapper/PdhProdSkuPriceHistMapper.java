package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdhProdSkuPriceHistMapper {

    PdhProdSkuPriceHistDto.Item selectById(@Param("id") String id);

    List<PdhProdSkuPriceHistDto.Item> selectList(PdhProdSkuPriceHistDto.Request req);

    List<PdhProdSkuPriceHistDto.Item> selectPageList(PdhProdSkuPriceHistDto.Request req);

    long selectPageCount(PdhProdSkuPriceHistDto.Request req);

    int updateSelective(PdhProdSkuPriceHist entity);
}
