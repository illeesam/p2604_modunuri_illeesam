package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpWidgetRepository;

public interface DpWidgetRepository extends JpaRepository<DpWidget, String>, QDpWidgetRepository {
}
