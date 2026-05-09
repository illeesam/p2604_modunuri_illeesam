package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;

import java.util.List;

@Mapper
public interface PdProdHistMapper {

    List<PdProdHistDto.Item> selectOrders(Map<String, Object> p);

    List<PdProdHistDto.Item> selectStockHist(Map<String, Object> p);

    List<PdProdHistDto.Item> selectPriceHist(Map<String, Object> p);

    List<PdProdHistDto.Item> selectStatusHist(Map<String, Object> p);

    List<PdProdHistDto.Item> selectChangeHist(Map<String, Object> p);
}
