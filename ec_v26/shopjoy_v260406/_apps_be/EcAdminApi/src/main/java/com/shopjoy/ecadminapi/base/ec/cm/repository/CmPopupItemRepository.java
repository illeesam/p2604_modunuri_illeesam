package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopupItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmPopupItemRepository;
import org.springframework.data.jpa.repository.JpaRepository;

/* findByPopupIdAndUseYnOrderBySortOrdAsc → QCmPopupItemRepository.selectList(popupId, useYn) 로 전환 (2026-08-27) */
public interface CmPopupItemRepository extends JpaRepository<CmPopupItem, String>, QCmPopupItemRepository {
}
