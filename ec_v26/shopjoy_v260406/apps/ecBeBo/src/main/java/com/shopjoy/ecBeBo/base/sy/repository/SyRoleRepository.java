package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyRole;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyRoleRepository;

/* 역할 트리 자손ID 수집(findTreeRoleIds, 재귀 CTE) → QSyRoleRepository.selectTreeRoleIds (QueryDSL) 로 전환 */
public interface SyRoleRepository extends JpaRepository<SyRole, String>, QSyRoleRepository {
}
