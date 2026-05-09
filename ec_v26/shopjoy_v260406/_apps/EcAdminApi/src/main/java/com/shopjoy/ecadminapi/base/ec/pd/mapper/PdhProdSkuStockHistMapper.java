package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdhProdSkuStockHistMapper {

    PdhProdSkuStockHistDto.Item selectById(@Param("id") String id);

    List<PdhProdSkuStockHistDto.Item> selectList(PdhProdSkuStockHistDto.Request req);

    List<PdhProdSkuStockHistDto.Item> selectPageList(PdhProdSkuStockHistDto.Request req);

    long selectPageCount(PdhProdSkuStockHistDto.Request req);

    int updateSelective(PdhProdSkuStockHist entity);
}
