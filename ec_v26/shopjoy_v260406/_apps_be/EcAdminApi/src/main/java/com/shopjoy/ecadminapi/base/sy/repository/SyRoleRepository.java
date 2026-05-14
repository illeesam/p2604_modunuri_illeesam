package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyRoleRepository;

public interface SyRoleRepository extends JpaRepository<SyRole, String>, QSyRoleRepository {
}
