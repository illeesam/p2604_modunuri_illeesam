package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyExceldown;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyExceldownRepository;

public interface SyExceldownRepository extends JpaRepository<SyExceldown, String>, QSyExceldownRepository {
}
