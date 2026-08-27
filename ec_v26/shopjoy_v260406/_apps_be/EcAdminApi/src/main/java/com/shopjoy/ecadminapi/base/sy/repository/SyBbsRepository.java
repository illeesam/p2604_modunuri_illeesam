package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbsRepository;

/* 게시판 트리 자손ID 수집(findTreeBbsIds, 재귀 CTE) → QSyBbsRepository.selectTreeBbsIds (QueryDSL) 로 전환 */
public interface SyBbsRepository extends JpaRepository<SyBbs, String>, QSyBbsRepository {
}
