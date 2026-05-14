package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;

import java.util.List;
import java.util.Optional;

/** PmGiftIssue QueryDSL Custom Repository */
public interface QPmGiftIssueRepository {

    /** 단건 조회 */
    Optional<PmGiftIssueDto.Item> selectById(String giftIssueId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PmGiftIssueDto.Item> selectList(PmGiftIssueDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    PmGiftIssueDto.PageResponse selectPageList(PmGiftIssueDto.Request search);

    int updateSelective(PmGiftIssue entity);
}
