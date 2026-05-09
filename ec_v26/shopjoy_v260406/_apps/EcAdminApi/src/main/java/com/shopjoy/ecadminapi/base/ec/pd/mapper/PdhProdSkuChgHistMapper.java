package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdhProdSkuChgHistMapper {

    PdhProdSkuChgHistDto.Item selectById(@Param("id") String id);

    List<PdhProdSkuChgHistDto.Item> selectList(PdhProdSkuChgHistDto.Request req);

    List<PdhProdSkuChgHistDto.Item> selectPageList(PdhProdSkuChgHistDto.Request req);

    long selectPageCount(PdhProdSkuChgHistDto.Request req);

    int updateSelective(PdhProdSkuChgHist entity);
}
