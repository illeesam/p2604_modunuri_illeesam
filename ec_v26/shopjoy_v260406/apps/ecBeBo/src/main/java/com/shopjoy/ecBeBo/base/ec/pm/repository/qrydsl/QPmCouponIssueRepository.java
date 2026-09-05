package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCouponIssue;

import java.util.List;
import java.util.Optional;

/** PmCouponIssue QueryDSL Custom Repository */
public interface QPmCouponIssueRepository {

    Optional<PmCouponIssueDto.Item> selectById(String couponIssueId);

    List<PmCouponIssueDto.Item> selectList(PmCouponIssueDto.Request search);

    BasePage<PmCouponIssueDto.Item> selectPageData(PmCouponIssueDto.Request search);

    int updateSelective(PmCouponIssue entity);

    /** 지정 쿠폰ID 목록 중 미사용(useYn IS NULL OR &lt;&gt; 'Y') 발급 내역 — 배치 발송 대상.
     *  AND 안에 OR 그룹이 있어 Query Method 로 표현 불가 → QueryDSL */
    List<PmCouponIssue> selectUnusedByCouponIds(List<String> couponIds);
}
