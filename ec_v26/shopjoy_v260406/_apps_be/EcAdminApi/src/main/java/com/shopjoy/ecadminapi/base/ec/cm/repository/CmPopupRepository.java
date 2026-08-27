package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmPopupRepository;
import org.springframework.data.jpa.repository.JpaRepository;

/* findByPopupCodeAndUseYn → QCmPopupRepository.selectByPopupCode(+ 호출측 useYn 필터)
   findByUseYnOrderBySortOrdAsc → QCmPopupRepository.selectList(useYn 필터) 로 통합 (2026-08-27) */
public interface CmPopupRepository extends JpaRepository<CmPopup, String>, QCmPopupRepository {
}
