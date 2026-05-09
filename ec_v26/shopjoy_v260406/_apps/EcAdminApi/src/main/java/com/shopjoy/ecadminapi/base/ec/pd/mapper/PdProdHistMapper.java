package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdProdHistMapper {

    List<PdProdHistDto.Item> selectOrders(@Param("prodId") String prodId, Map<String, Object> p);

    List<PdProdHistDto.Item> selectStockHist(@Param("prodId") String prodId, Map<String, Object> p);

    List<PdProdHistDto.Item> selectPriceHist(@Param("prodId") String prodId, Map<String, Object> p);

    List<PdProdHistDto.Item> selectStatusHist(@Param("prodId") String prodId, Map<String, Object> p);

    List<PdProdHistDto.Item> selectChangeHist(@Param("prodId") String prodId, Map<String, Object> p);
}
