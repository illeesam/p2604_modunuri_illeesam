package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.common.data.BasePage;

import java.util.Map;

/**
 * CmDashboardItem QueryDSL Custom Repository.
 *
 * <p>화면이 필드 일부만 보내는 부분수정(예: {@code CmDashboardDataMng.js} 의 시리즈표시방법만
 * 저장)에서, JPA 엔티티를 fetch 해 {@code VoUtil.voCopyExclude} 로 덮어쓴 뒤 전체 컬럼을 SAVE
 * 하는 방식 대신 실제 SET 하려는 컬럼만 UPDATE 문에 담기 위한 창구.</p>
 */
public interface QCmDashboardItemRepository {

    int updateSelective(CmDashboardItem entity);

    /**
     * 차트(keyLevel=1) 서버사이드 페이징 조회 — 항목관리 화면의 "대시보드 위젯항목 목록".
     * 파라미터: dashboardId(단일) 또는 dashboardIds(콤마구분, 우선순위는 dashboardId 먼저) / useYn / itemNm / pageNo / pageSize.
     * itemNm 은 차트 자신의 이름뿐 아니라 그 아래 시리즈·항목(item_key 가 'chartCd-%')의 이름까지 검색한다.
     */
    BasePage<CmDashboardItem> selectChartPage(Map<String, Object> p);
}
