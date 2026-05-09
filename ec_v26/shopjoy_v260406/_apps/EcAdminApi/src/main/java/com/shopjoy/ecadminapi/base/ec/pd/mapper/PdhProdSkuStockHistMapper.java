package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface PdhProdSkuStockHistMapper {

    PdhProdSkuStockHistDto.Item selectById(@Param("id") String id);

    List<PdhProdSkuStockHistDto.Item> selectList(Map<String, Object> p);

    List<PdhProdSkuStockHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(PdhProdSkuStockHist entity);
}
