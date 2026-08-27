package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBatchRepository;

/* findByBatchStatusCd → QSyBatchRepository.selectListByBatchStatusCd 로 전환
   findByBatchCode → QSyBatchRepository.selectByBatchCode 로 전환 (2026-08-27) */
public interface SyBatchRepository extends JpaRepository<SyBatch, String>, QSyBatchRepository {
}
