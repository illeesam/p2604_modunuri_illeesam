package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmPlanRepository;

import java.util.List;

public interface PmPlanRepository extends JpaRepository<PmPlan, String>, QPmPlanRepository {

    /**
     * 상태 자동 동기화 대상 기획전 조회.
     * - use_yn='Y' 이고 DRAFT / ACTIVE 상태인 건만 처리
     * - ENDED 상태는 날짜가 역행하지 않는 한 재전환 없음 → 조회 제외
     * - use_yn='N'(수동 비활성) 기획전은 배치가 건드리지 않음
     */
    @Query("SELECT p FROM PmPlan p " +
           "WHERE p.useYn = 'Y' " +
           "AND p.planStatusCd IN ('DRAFT', 'ACTIVE')")
    List<PmPlan> findSyncTargets();
}
