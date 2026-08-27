package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponIssueRepository;

/* findUnusedByCouponIds → QPmCouponIssueRepository.selectUnusedByCouponIds 로 전환 (2026-08-27) */
public interface PmCouponIssueRepository extends JpaRepository<PmCouponIssue, String>, QPmCouponIssueRepository {
}
