package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyMenuRepository;


public interface SyMenuRepository extends JpaRepository<SyMenu, String>, QSyMenuRepository {

}
