package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdContentChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdContentChgHist;

import java.util.List;
import java.util.Optional;

/** PdhProdContentChgHist QueryDSL Custom Repository */
public interface QPdhProdContentChgHistRepository {

    /** 단건 조회 */
    Optional<PdhProdContentChgHistDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdhProdContentChgHistDto.Item> selectList(PdhProdContentChgHistDto.Request search);

    /** 페이지 목록 */
    PdhProdContentChgHistDto.PageResponse selectPageList(PdhProdContentChgHistDto.Request search);

    int updateSelective(PdhProdContentChgHist entity);
}
