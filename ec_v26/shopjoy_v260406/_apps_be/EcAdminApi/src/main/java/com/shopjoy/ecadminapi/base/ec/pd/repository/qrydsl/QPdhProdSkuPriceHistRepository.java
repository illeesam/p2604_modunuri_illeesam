package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;

import java.util.List;
import java.util.Optional;

/** PdhProdSkuPriceHist QueryDSL Custom Repository */
public interface QPdhProdSkuPriceHistRepository {

    /** 단건 조회 */
    Optional<PdhProdSkuPriceHistDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdhProdSkuPriceHistDto.Item> selectList(PdhProdSkuPriceHistDto.Request search);

    /** 페이지 목록 */
    PdhProdSkuPriceHistDto.PageResponse selectPageList(PdhProdSkuPriceHistDto.Request search);

    int updateSelective(PdhProdSkuPriceHist entity);
}
