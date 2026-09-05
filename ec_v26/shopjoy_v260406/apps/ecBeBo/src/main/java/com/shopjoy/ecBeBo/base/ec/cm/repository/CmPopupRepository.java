package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmPopupRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CmPopupRepository extends JpaRepository<CmPopup, String>, QCmPopupRepository {


    Optional<CmPopup> findByPopupCodeAndUseYn(String popupCode, String useYn);


    List<CmPopup> findByUseYnOrderBySortOrdAsc(String useYn);
}
