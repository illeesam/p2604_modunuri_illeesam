package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserPref;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserPrefRepository;
import org.springframework.data.jpa.repository.JpaRepository;

/* findByUserIdAndPrefKey → QSyUserPrefRepository.selectByUserIdAndPrefKey 로 전환 (2026-08-27) */
public interface SyUserPrefRepository extends JpaRepository<SyUserPref, String>, QSyUserPrefRepository {
}
