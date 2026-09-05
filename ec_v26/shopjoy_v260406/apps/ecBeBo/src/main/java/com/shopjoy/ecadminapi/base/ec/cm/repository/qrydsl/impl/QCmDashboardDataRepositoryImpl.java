package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmDashboardData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** CmDashboardData(대시보드 3레벨 항목 실데이터) QueryDSL Custom 구현체 */
@Slf4j
@RequiredArgsConstructor
public class QCmDashboardDataRepositoryImpl implements QCmDashboardDataRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmDashboardDataRepositoryImpl";
    private static final QCmDashboardData cmDashboardData = QCmDashboardData.cmDashboardData;

    /** 단건 조회 — hibernate.comment 힌트가 붙는 QueryDSL 진입점 */
    @Override
    public Optional<CmDashboardData> selectById(String dashboardDataId) {
        if (dashboardDataId == null) return Optional.empty();
        CmDashboardData row = queryFactory.selectFrom(cmDashboardData)
            .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
            .where(cmDashboardData.dashboardDataId.eq(dashboardDataId))
            .fetchOne();
        return Optional.ofNullable(row);
    }

    /**
     * 조건 목록 조회 — siteId / yyyymmdd / dashboardItemIds(목록) 을 옵션으로 조합한다.
     * '대시보드 데이타관리' 화면 조회(findRows)가 쓰는 (사이트 × 기간 × 차트들) 패턴이 유일한
     * 소비처라 그 셋만 지원한다. 예전 selectBySiteYmdChartIds(2026-08-26 신설)를 이름만
     * 표준(selectList)으로 맞췄다(2026-08-27).
     */
    @Override
    @SuppressWarnings("unchecked")
    public List<CmDashboardData> selectList(Map<String, Object> p) {
        String siteId = (String) p.get("siteId");
        String yyyymmdd = (String) p.get("yyyymmdd");
        List<String> dashboardItemIds = (List<String>) p.get("dashboardItemIds");
        if (dashboardItemIds == null || dashboardItemIds.isEmpty()) return List.of();

        return queryFactory.selectFrom(cmDashboardData)
            .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
            .where(
                siteId != null && !siteId.isBlank() ? cmDashboardData.siteId.eq(siteId) : null,
                yyyymmdd != null && !yyyymmdd.isBlank() ? cmDashboardData.yyyymmdd.eq(yyyymmdd) : null,
                cmDashboardData.dashboardItemId.in(dashboardItemIds)
            )
            .orderBy(cmDashboardData.dashboardItemId.asc(), cmDashboardData.itemKey.asc())
            .fetch();
    }

    /**
     * UNIQUE 좌표(item_key, data_opts, data_opt2s) 로 단건을 찾는다 — 저장 시 upsert 판정에 쓴다.
     * 검색조건 DTO 가 아니라 복합키 그대로 받는 형태라 selectById/selectList 로는 표현이 안 돼
     * 별도로 둔다(base.backend-EcAdminApi.md §14.6.8 예외 1호).
     */
    @Override
    public Optional<CmDashboardData> selectByCoordinate(String itemKey, String dataOpts, String dataOpt2s) {
        if (itemKey == null) return Optional.empty();
        CmDashboardData row = queryFactory.selectFrom(cmDashboardData)
            .setHint("org.hibernate.comment", QRY_SRC + " :: selectByCoordinate()")
            .where(
                cmDashboardData.itemKey.eq(itemKey),
                cmDashboardData.dataOpts.eq(dataOpts),
                dataOpt2s == null ? cmDashboardData.dataOpt2s.isNull() : cmDashboardData.dataOpt2s.eq(dataOpt2s)
            )
            .fetchFirst();
        return Optional.ofNullable(row);
    }

    /** updateSelective — null 아닌 필드만 SET (dept_id/user_id/data_val 만 실제로 부분수정 대상) */
    @Override
    public int updateSelective(CmDashboardData entity) {
        if (entity.getDashboardDataId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmDashboardData);
        boolean hasAny = false;

        if (entity.getDeptId() != null)  { update.set(cmDashboardData.deptId,  entity.getDeptId());  hasAny = true; }
        if (entity.getUserId() != null)  { update.set(cmDashboardData.userId,  entity.getUserId());  hasAny = true; }
        if (entity.getDataVal() != null) { update.set(cmDashboardData.dataVal, entity.getDataVal()); hasAny = true; }
        if (entity.getUpdBy() != null)   { update.set(cmDashboardData.updBy,   entity.getUpdBy());   hasAny = true; }
        update.set(cmDashboardData.updDate, java.time.LocalDateTime.now());

        if (!hasAny) return 0;

        long affected = update.where(cmDashboardData.dashboardDataId.eq(entity.getDashboardDataId())).execute();
        return (int) affected;
    }

    /**
     * item_key 변경 연쇄 갱신 — item1_key/item2_key/item3_key 도 새 item_key 기준으로 같이
     * 재계산한다. {@code function('split_part', ...)}/{@code function('nullif', ...)} 는 JPQL
     * 표준 이스케이프로 PostgreSQL 네이티브 함수를 그대로 호출한다(Hibernate 가 등록 없이도
     * 그대로 방언에 전달) — 별도 native SQL 없이 QueryDSL 만으로 표현할 수 있다. updateSelective
     * 는 "온 필드만 그대로 SET" 전제라 계산식(split_part) SET 은 표현 못 해 별도로 둔다
     * (base.backend-EcAdminApi.md §14.6.8 예외 3호).
     */
    @Override
    public int updateItemKey(String oldKey, String newKey) {
        if (oldKey == null || newKey == null || oldKey.equals(newKey)) return 0;

        StringExpression item1 = Expressions.stringTemplate("function('split_part', {0}, '-', 1)", newKey);
        StringExpression item2Raw = Expressions.stringTemplate("function('split_part', {0}, '-', 2)", newKey);
        StringExpression item3Raw = Expressions.stringTemplate("function('split_part', {0}, '-', 3)", newKey);
        StringExpression item2 = Expressions.stringTemplate("function('nullif', {0}, '')", item2Raw);
        StringExpression item3 = Expressions.stringTemplate("function('nullif', {0}, '')", item3Raw);

        long affected = queryFactory.update(cmDashboardData)
            .set(cmDashboardData.itemKey, newKey)
            .set(cmDashboardData.item1Key, item1)
            .set(cmDashboardData.item2Key, item2)
            .set(cmDashboardData.item3Key, item3)
            .where(cmDashboardData.itemKey.eq(oldKey))
            .execute();

        log.info("[QCmDashboardDataRepositoryImpl.updateItemKey] {} -> {} :: {}건", oldKey, newKey, affected);
        return (int) affected;
    }
}
