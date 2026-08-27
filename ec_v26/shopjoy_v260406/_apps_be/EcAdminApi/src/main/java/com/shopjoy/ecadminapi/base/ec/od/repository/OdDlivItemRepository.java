package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivItemRepository;

/* findByDlivId → QOdDlivItemRepository.selectListByDlivId 로 전환 (2026-08-27) */
public interface OdDlivItemRepository extends JpaRepository<OdDlivItem, String>, QOdDlivItemRepository {
}
