package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardDataRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 조건 1~2개인 단순 조회/삭제만 여기 둔다. 조건이 3개 이상이거나 ORDER BY 를 여럿 붙여야
 * 하는(파생 쿼리명이 한 줄로 안 읽히는) 것들은 {@link QCmDashboardDataRepository}
 * (QueryDSL Custom, {@code qrydsl/impl/QCmDashboardDataRepositoryImpl})로 옮겼다(2026-08-26).
 * 그 과정에서 호출부가 하나도 없던 파생 쿼리 4개(findByDashboardItemIdAndYyyymmdd 등)도
 * 함께 정리했다.
 */
@Repository
public interface CmDashboardDataRepository extends JpaRepository<CmDashboardData, String>, QCmDashboardDataRepository {

    /** 정의행이 사라질 때 그 자리에 있던 값도 함께 정리 */
    int deleteByItemKey(String itemKey);

    /** 항목 단건 삭제(외부 단건 upsert API 의 delete 짝) */
    void deleteByDashboardItemIdAndYyyymmdd(String dashboardItemId, String yyyymmdd);
}
