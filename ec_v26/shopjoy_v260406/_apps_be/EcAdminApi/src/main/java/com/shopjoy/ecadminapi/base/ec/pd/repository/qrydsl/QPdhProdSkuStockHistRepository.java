package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;

import java.util.List;
import java.util.Optional;

/** PdhProdSkuStockHist QueryDSL Custom Repository */
public interface QPdhProdSkuStockHistRepository {

    /** 단건 조회 */
    Optional<PdhProdSkuStockHistDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdhProdSkuStockHistDto.Item> selectList(PdhProdSkuStockHistDto.Request search);

    /** 페이지 목록 */
    PdhProdSkuStockHistDto.PageResponse selectPageList(PdhProdSkuStockHistDto.Request search);

    int updateSelective(PdhProdSkuStockHist entity);
}
