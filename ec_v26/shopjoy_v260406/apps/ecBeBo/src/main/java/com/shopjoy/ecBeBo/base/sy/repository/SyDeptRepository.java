package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyDept;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyDeptRepository;

/* 부서 트리 자손ID 수집(findTreeDeptIds, 재귀 CTE) → QSyDeptRepository.selectTreeDeptIds (QueryDSL) 로 전환 */
public interface SyDeptRepository extends JpaRepository<SyDept, String>, QSyDeptRepository {
}
