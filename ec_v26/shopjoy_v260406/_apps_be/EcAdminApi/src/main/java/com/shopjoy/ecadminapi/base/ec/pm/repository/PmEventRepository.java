package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventRepository;

/* findSyncTargets → QPmEventRepository.selectSyncTargets 로 전환 (2026-08-27) */
public interface PmEventRepository extends JpaRepository<PmEvent, String>, QPmEventRepository {
}
