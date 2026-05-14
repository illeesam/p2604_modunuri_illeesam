package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpAreaPanelRepository;

public interface DpAreaPanelRepository extends JpaRepository<DpAreaPanel, String>, QDpAreaPanelRepository {
}
