package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPathRepository;

/* 표시경로 트리 자손ID 수집(findTreePathIds, 재귀 CTE) → QSyPathRepository.selectTreePathIds (QueryDSL) 로 전환 */
public interface SyPathRepository extends JpaRepository<SyPath, String>, QSyPathRepository {
}
