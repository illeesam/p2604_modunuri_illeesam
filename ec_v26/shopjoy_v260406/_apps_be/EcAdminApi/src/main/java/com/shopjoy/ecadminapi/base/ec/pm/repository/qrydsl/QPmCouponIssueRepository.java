package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;

import java.util.List;
import java.util.Optional;

/** PmCouponIssue QueryDSL Custom Repository */
public interface QPmCouponIssueRepository {

    Optional<PmCouponIssueDto.Item> selectById(String couponIssueId);

    List<PmCouponIssueDto.Item> selectList(PmCouponIssueDto.Request search);

    BasePage<PmCouponIssueDto.Item> selectPageData(PmCouponIssueDto.Request search);

    int updateSelective(PmCouponIssue entity);

    /** 지정 쿠폰ID 목록 중 미사용(use_yn≠Y) 발급 내역 — 배치 발송 대상 (관리 엔티티 그대로 반환).
     *  base 의 findUnusedByCouponIds 대체 (2026-08-27) */
    List<PmCouponIssue> selectUnusedByCouponIds(List<String> couponIds);
}
