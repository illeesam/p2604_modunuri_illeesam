package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import org.springframework.data.jpa.repository.JpaRepository;

import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachRepository;

/* findByRefTableNmAndRefIdInOrderByRefIdAscSortOrdAscAttachIdAsc → QSyAttachRepository.selectListByRefIds 로 전환 (2026-08-27) */
public interface SyAttachRepository extends JpaRepository<SyAttach, String>, QSyAttachRepository {
}
