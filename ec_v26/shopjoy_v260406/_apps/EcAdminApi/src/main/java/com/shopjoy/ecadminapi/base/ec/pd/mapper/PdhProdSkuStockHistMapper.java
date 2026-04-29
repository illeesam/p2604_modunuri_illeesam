package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdhProdSkuStockHistMapper {

    PdhProdSkuStockHistDto selectById(@Param("id") String id);

    List<PdhProdSkuStockHistDto> selectList(Map<String, Object> p);

    List<PdhProdSkuStockHistDto> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(PdhProdSkuStockHist entity);
}
