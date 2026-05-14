package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;

import java.util.List;
import java.util.Optional;

/** PdReview QueryDSL Custom Repository */
public interface QPdReviewRepository {

    /** 단건 조회 */
    Optional<PdReviewDto.Item> selectById(String reviewId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdReviewDto.Item> selectList(PdReviewDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    PdReviewDto.PageResponse selectPageList(PdReviewDto.Request search);

    int updateSelective(PdReview entity);
}
