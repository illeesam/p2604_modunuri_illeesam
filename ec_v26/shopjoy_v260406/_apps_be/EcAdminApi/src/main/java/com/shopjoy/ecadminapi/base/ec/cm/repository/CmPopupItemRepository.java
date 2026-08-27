package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopupItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CmPopupItemRepository extends JpaRepository<CmPopupItem, String> {

    List<CmPopupItem> findByPopupIdAndUseYnOrderBySortOrdAsc(String popupId, String useYn);
}
