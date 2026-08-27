package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopupItem;

import java.util.List;

/**
 * CmPopupItem QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 단순 자식 컬렉션이라 baseSelColumnQuery 없이
 * 엔티티를 그대로 반환한다(PdProdStock 과 동일한 "단순 구조" 패턴).</p>
 */
public interface QCmPopupItemRepository {

    /** 팝업 항목 목록 — popupId + useYn 조건, sortOrd 오름차순 고정.
     *  base 의 findByPopupIdAndUseYnOrderBySortOrdAsc 대체 (2026-08-27) */
    List<CmPopupItem> selectList(String popupId, String useYn);
}
