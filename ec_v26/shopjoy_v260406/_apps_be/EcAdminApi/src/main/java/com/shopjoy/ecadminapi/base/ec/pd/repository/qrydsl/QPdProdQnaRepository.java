package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;

import java.util.List;
import java.util.Optional;

/** PdProdQna QueryDSL Custom Repository */
public interface QPdProdQnaRepository {

    /** 단건 조회 */
    Optional<PdProdQnaDto.Item> selectById(String qnaId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdProdQnaDto.Item> selectList(PdProdQnaDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    PdProdQnaDto.PageResponse selectPageList(PdProdQnaDto.Request search);

    int updateSelective(PdProdQna entity);
}
