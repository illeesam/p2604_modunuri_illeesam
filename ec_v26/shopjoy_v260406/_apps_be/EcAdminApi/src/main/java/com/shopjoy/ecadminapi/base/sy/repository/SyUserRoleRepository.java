package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserRoleRepository;

/* findByUserId → QSyUserRoleRepository.selectList(Request.userId) 로 통합 (2026-08-27) */
public interface SyUserRoleRepository extends JpaRepository<SyUserRole, String>, QSyUserRoleRepository {
}
