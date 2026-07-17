package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventRepository;

import java.util.List;

public interface PmEventRepository extends JpaRepository<PmEvent, String>, QPmEventRepository {

    /**
     * 상태 자동 동기화 대상 이벤트 조회.
     * - use_yn='Y' 이고 PENDING / ACTIVE 상태인 건만 처리
     * - ENDED 는 날짜가 역행하지 않는 한 재전환 불필요 → 조회 제외
     * - 수동으로 비활성(use_yn='N') 처리한 이벤트는 배치 전환 대상 제외
     */
    @Query("SELECT e FROM PmEvent e " +
           "WHERE e.useYn = 'Y' " +
           "AND e.eventStatusCd IN ('PENDING', 'ACTIVE')")
    List<PmEvent> findSyncTargets();
}
