package com.shopjoy.ecBeBo.base.ec.dp.repository;

import com.shopjoy.ecBeBo.base.ec.dp.data.entity.DpPanelItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.dp.repository.qrydsl.QDpPanelItemRepository;

/* findByPanelIdOrderBySortOrdAsc → QDpPanelItemRepository.selectList(Request.panelId) 로 통합 (2026-08-27) */
public interface DpPanelItemRepository extends JpaRepository<DpPanelItem, String>, QDpPanelItemRepository {
    void deleteByPanelId(String panelId);
}
