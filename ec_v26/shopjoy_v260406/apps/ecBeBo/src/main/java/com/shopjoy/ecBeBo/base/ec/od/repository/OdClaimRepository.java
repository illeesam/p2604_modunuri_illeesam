package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdClaimRepository;

import java.time.LocalDateTime;
import java.util.List;

/* claimCancelYn IS NULL OR <> 'Y' 같은 AND-속-OR 조건은 Query Method 로 표현 불가 →
   QOdClaimRepository.selectCompltCancelReturnClaims() (QueryDSL) 사용 */
public interface OdClaimRepository extends JpaRepository<OdClaim, String>, QOdClaimRepository {

    /** 미처리 클레임 경보 대상 — claimStatusCd 상태로 threshold 이전 등록 */
    List<OdClaim> findByClaimStatusCdAndRegDateBefore(String claimStatusCd, LocalDateTime threshold);
}
