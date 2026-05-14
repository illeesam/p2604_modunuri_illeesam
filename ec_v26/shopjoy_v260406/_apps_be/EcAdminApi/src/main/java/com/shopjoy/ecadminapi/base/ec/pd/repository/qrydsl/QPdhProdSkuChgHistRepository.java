package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;

import java.util.List;
import java.util.Optional;

/** PdhProdSkuChgHist QueryDSL Custom Repository */
public interface QPdhProdSkuChgHistRepository {

    /** 단건 조회 */
    Optional<PdhProdSkuChgHistDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdhProdSkuChgHistDto.Item> selectList(PdhProdSkuChgHistDto.Request search);

    /** 페이지 목록 */
    PdhProdSkuChgHistDto.PageResponse selectPageList(PdhProdSkuChgHistDto.Request search);

    int updateSelective(PdhProdSkuChgHist entity);
}
