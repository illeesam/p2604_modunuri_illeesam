package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CmPopupRepository extends JpaRepository<CmPopup, String> {

    Optional<CmPopup> findBySiteIdAndPopupCodeAndUseYn(String siteId, String popupCode, String useYn);

    Optional<CmPopup> findByPopupCodeAndUseYn(String popupCode, String useYn);

    List<CmPopup> findBySiteIdAndUseYnOrderBySortOrdAsc(String siteId, String useYn);

    List<CmPopup> findByUseYnOrderBySortOrdAsc(String useYn);
}
