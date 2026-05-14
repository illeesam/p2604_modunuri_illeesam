package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbsRepository;

public interface SyBbsRepository extends JpaRepository<SyBbs, String>, QSyBbsRepository {
}
