package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyBbs;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyBbsRepository;

/* 게시판 트리 자손ID 수집(findTreeBbsIds, 재귀 CTE) → QSyBbsRepository.selectTreeBbsIds (QueryDSL) 로 전환 */
public interface SyBbsRepository extends JpaRepository<SyBbs, String>, QSyBbsRepository {
}
