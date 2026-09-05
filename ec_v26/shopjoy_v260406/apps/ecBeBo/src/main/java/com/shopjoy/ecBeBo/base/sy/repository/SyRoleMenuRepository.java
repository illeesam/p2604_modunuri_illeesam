package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyRoleMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyRoleMenuRepository;

public interface SyRoleMenuRepository extends JpaRepository<SyRoleMenu, String>, QSyRoleMenuRepository {
}
