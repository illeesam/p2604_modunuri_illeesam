package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpWidgetLibRepository;

public interface DpWidgetLibRepository extends JpaRepository<DpWidgetLib, String>, QDpWidgetLibRepository {
}
