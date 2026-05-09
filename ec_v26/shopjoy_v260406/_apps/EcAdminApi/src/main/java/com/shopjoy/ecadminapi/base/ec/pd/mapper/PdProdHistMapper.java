package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PdProdHistMapper {

    List<PdProdHistDto.Item> selectOrders(PdProdHistDto.Request req);

    List<PdProdHistDto.Item> selectStockHist(PdProdHistDto.Request req);

    List<PdProdHistDto.Item> selectPriceHist(PdProdHistDto.Request req);

    List<PdProdHistDto.Item> selectStatusHist(PdProdHistDto.Request req);

    List<PdProdHistDto.Item> selectChangeHist(PdProdHistDto.Request req);
}
