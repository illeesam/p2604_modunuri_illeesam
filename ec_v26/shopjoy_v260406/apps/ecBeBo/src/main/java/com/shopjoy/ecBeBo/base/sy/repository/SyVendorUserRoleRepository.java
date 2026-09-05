package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendorUserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyVendorUserRoleRepository;

/* findByUserId → QSyVendorUserRoleRepository.selectList(Request.userId) 로 통합 (2026-08-27) */
public interface SyVendorUserRoleRepository extends JpaRepository<SyVendorUserRole, String>, QSyVendorUserRoleRepository {
}
