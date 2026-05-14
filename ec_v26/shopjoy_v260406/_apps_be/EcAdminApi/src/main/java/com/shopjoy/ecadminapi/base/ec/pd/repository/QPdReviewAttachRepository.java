package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;

import java.util.List;
import java.util.Optional;

/** PdReviewAttach QueryDSL Custom Repository */
public interface QPdReviewAttachRepository {

    /** 단건 조회 */
    Optional<PdReviewAttachDto.Item> selectById(String reviewAttachId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdReviewAttachDto.Item> selectList(PdReviewAttachDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    PdReviewAttachDto.PageResponse selectPageList(PdReviewAttachDto.Request search);

    int updateSelective(PdReviewAttach entity);
}
