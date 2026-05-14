package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;

import java.util.List;
import java.util.Optional;

/** PdReviewComment QueryDSL Custom Repository */
public interface QPdReviewCommentRepository {

    /** 단건 조회 */
    Optional<PdReviewCommentDto.Item> selectById(String reviewCommentId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdReviewCommentDto.Item> selectList(PdReviewCommentDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    PdReviewCommentDto.PageResponse selectPageList(PdReviewCommentDto.Request search);

    int updateSelective(PdReviewComment entity);
}
