package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyNoti;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyNotiRepository;

public interface SyNotiRepository extends JpaRepository<SyNoti, String>, QSyNotiRepository {
}
