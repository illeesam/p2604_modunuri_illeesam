package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSySiteRepository;

public interface SySiteRepository extends JpaRepository<SySite, String>, QSySiteRepository {
    /* path-counts 메서드는 QSySiteRepository(impl)로 이동 — 동적 native SQL */
}
