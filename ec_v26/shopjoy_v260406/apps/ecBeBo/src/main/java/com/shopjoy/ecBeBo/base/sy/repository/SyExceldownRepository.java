package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyExceldown;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyExceldownRepository;

public interface SyExceldownRepository extends JpaRepository<SyExceldown, String>, QSyExceldownRepository {
}
