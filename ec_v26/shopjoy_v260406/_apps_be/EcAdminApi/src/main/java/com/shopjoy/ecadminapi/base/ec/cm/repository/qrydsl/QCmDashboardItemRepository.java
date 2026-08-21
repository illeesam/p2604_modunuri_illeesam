package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;

/**
 * CmDashboardItem QueryDSL Custom Repository.
 *
 * <p>화면이 필드 일부만 보내는 부분수정(예: {@code CmDashboardDataMng.js} 의 시리즈표시방법만
 * 저장)에서, JPA 엔티티를 fetch 해 {@code VoUtil.voCopyExclude} 로 덮어쓴 뒤 전체 컬럼을 SAVE
 * 하는 방식 대신 실제 SET 하려는 컬럼만 UPDATE 문에 담기 위한 창구. select 계열은 기존
 * {@code CmDashboardItemRepository} 의 파생 쿼리로 충분해 여기 두지 않는다.</p>
 */
public interface QCmDashboardItemRepository {

    int updateSelective(CmDashboardItem entity);
}
