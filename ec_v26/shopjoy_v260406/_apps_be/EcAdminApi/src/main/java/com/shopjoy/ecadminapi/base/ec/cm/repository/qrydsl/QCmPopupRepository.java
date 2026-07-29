package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPopupDto;

public interface QCmPopupRepository {

    /** 팝업 정의 페이지 목록 (팝업관리 화면) */
    BasePage<CmPopup> selectPageData(CmPopupDto.Request search);
}
