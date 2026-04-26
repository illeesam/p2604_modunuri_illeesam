package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdProdHistMapper {

    List<PdProdHistDto> selectOrders(@Param("prodId") String prodId, @Param("p") Map<String, Object> p);

    List<PdProdHistDto> selectStockHist(@Param("prodId") String prodId, @Param("p") Map<String, Object> p);

    List<PdProdHistDto> selectPriceHist(@Param("prodId") String prodId, @Param("p") Map<String, Object> p);

    List<PdProdHistDto> selectStatusHist(@Param("prodId") String prodId, @Param("p") Map<String, Object> p);

    List<PdProdHistDto> selectChangeHist(@Param("prodId") String prodId, @Param("p") Map<String, Object> p);
}
