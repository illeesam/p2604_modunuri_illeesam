package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyMenuRepository;

public interface SyMenuRepository extends JpaRepository<SyMenu, String>, QSyMenuRepository {
}
