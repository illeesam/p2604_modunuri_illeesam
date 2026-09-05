package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCouponIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmCouponIssueRepository;

/* useYn IS NULL OR <> 'Y' 는 AND-속-OR 라 Query Method 로 표현 불가 →
   QPmCouponIssueRepository.selectUnusedByCouponIds() (QueryDSL) 사용 */
public interface PmCouponIssueRepository extends JpaRepository<PmCouponIssue, String>, QPmCouponIssueRepository {
}
