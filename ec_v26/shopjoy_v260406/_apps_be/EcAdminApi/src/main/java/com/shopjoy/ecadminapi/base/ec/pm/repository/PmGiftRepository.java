package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftRepository;

/* findSyncTargets → QPmGiftRepository.selectSyncTargets 로 전환 (2026-08-27) */
public interface PmGiftRepository extends JpaRepository<PmGift, String>, QPmGiftRepository {
}
