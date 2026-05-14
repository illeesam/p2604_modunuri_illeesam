package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;

import java.util.List;
import java.util.Optional;

/** PdhProdStatusHist QueryDSL Custom Repository */
public interface QPdhProdStatusHistRepository {

    /** 단건 조회 */
    Optional<PdhProdStatusHistDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdhProdStatusHistDto.Item> selectList(PdhProdStatusHistDto.Request search);

    /** 페이지 목록 */
    PdhProdStatusHistDto.PageResponse selectPageList(PdhProdStatusHistDto.Request search);

    int updateSelective(PdhProdStatusHist entity);
}
