package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponIssueRepository;

import java.util.List;

public interface PmCouponIssueRepository extends JpaRepository<PmCouponIssue, String>, QPmCouponIssueRepository {

    /**
     * 지정 쿠폰ID 목록 중 미사용(use_yn='N') 발급 내역 조회 — 배치 발송 대상 추출용.
     */
    @Query("SELECT i FROM PmCouponIssue i " +
           "WHERE i.siteId = :siteId " +
           "AND i.couponId IN :couponIds " +
           "AND (i.useYn IS NULL OR i.useYn <> 'Y')")
    List<PmCouponIssue> findUnusedByCouponIds(@Param("siteId") String siteId,
                                               @Param("couponIds") List<String> couponIds);
}
