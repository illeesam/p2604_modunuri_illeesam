package com.shopjoy.ecadminapi.bo.zd.qrydsl;

import com.shopjoy.ecadminapi.bo.zd.entity.ZdSimulLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** ZdSimulLog QueryDSL Custom Repository */
public interface QZdSimulLogRepository {

    /** 시뮬레이터 실행 로그 검색 — siteId 필수 + 나머지는 선택 필터(동적 조합) */
    Page<ZdSimulLog> selectPage(String siteId, String domain, String uiNm, String userNm, String desc, String status, Pageable pageable);
}
