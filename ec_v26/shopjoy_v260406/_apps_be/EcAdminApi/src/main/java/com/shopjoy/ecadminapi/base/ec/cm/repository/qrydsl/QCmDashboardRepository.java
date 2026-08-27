package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;

import java.util.List;
import java.util.Optional;

/**
 * CmDashboard QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 단순 헤더 테이블이라 baseSelColumnQuery 없이
 * 엔티티를 그대로 반환한다(PdProdStock 과 동일한 "단순 구조" 패턴).</p>
 */
public interface QCmDashboardRepository {

    /** 조건 목록 조회 — useYn(선택). 미지정 시 전체. sortOrd 오름차순 고정.
     *  base 의 findAllByOrderBySortOrdAsc / findByUseYnOrderBySortOrdAsc 대체 (2026-08-27) */
    List<CmDashboard> selectList(String useYn);

    /** UNIQUE(ui_comp_nm) 단건 조회 — base 의 findByUiCompNm 대체 (2026-08-27) */
    Optional<CmDashboard> selectByUiCompNm(String uiCompNm);
}
