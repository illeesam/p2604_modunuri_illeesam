package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;

import java.util.List;
import java.util.Optional;

/** PdProdRel QueryDSL Custom Repository */
public interface QPdProdRelRepository {

    /** 단건 조회 */
    Optional<PdProdRelDto.Item> selectById(String prodRelId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdProdRelDto.Item> selectList(PdProdRelDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    PdProdRelDto.PageResponse selectPageList(PdProdRelDto.Request search);

    int updateSelective(PdProdRel entity);
}
