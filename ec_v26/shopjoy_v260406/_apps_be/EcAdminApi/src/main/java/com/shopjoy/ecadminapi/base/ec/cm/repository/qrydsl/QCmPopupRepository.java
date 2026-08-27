package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPopupDto;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface QCmPopupRepository {

    /** UNIQUE(popup_code) 단건 조회 — base 의 findByPopupCodeAndUseYn 대체(useYn 은 호출측에서 필터) */
    Optional<CmPopup> selectByPopupCode(String popupCode);

    /** 조건 검색 — 파라미터: useYn(선택). 정렬순서 sortOrd asc, popupCode asc.
     *  base 의 findByUseYnOrderBySortOrdAsc 대체 */
    List<CmPopup> selectList(Map<String, Object> p);

    /** 팝업 정의 페이지 목록 (팝업관리 화면) */
    BasePage<CmPopup> selectPageData(CmPopupDto.Request search);
}
