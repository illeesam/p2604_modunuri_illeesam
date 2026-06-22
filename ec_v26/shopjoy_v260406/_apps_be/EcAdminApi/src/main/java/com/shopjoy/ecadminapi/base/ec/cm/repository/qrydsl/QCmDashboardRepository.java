package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmDashboardDto;

import java.util.List;
import java.util.Map;

/** cm_dashboard QueryDSL Custom Repository */
public interface QCmDashboardRepository {

    /**
     * compId 에 해당하는 차트 데이터를 조회한다.
     *
     * @param compId COMP0101 ~ COMP0403
     * @param p      siteNo / uiNm 등 공통 필터
     */
    List<CmDashboardDto> selectDashboard(String compId, Map<String, Object> p);
}
