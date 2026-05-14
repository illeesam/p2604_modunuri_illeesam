package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;

import java.util.List;
import java.util.Optional;

/** PdProd QueryDSL Custom Repository */
public interface QPdProdRepository {

    /** 단건 조회 */
    Optional<PdProdDto.Item> selectById(String prodId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdProdDto.Item> selectList(PdProdDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    PdProdDto.PageResponse selectPageList(PdProdDto.Request search);

    int updateSelective(PdProd entity);
}
