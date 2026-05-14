package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;

import java.util.List;
import java.util.Optional;

/** PdhProdChgHist QueryDSL Custom Repository */
public interface QPdhProdChgHistRepository {

    /** 단건 조회 */
    Optional<PdhProdChgHistDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdhProdChgHistDto.Item> selectList(PdhProdChgHistDto.Request search);

    /** 페이지 목록 */
    PdhProdChgHistDto.PageResponse selectPageList(PdhProdChgHistDto.Request search);

    int updateSelective(PdhProdChgHist entity);
}
