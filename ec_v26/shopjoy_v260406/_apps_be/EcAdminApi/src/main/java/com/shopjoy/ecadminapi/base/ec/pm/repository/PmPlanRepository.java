package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmPlanRepository;

import java.util.List;

public interface PmPlanRepository extends JpaRepository<PmPlan, String>, QPmPlanRepository {

    /** 상태 자동 동기화 배치 대상 — planStatusCd 가 지정 목록에 포함된 계획 */
    List<PmPlan> findByUseYnAndPlanStatusCdIn(String useYn, List<String> planStatusCds);
}
