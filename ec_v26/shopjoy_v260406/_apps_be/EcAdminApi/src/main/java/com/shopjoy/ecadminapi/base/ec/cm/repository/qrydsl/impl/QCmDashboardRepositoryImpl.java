package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAQuery;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmDashboardDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

/** cm_dashboard QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmDashboardRepositoryImpl implements QCmDashboardRepository {

    private final JPAQueryFactory queryFactory;

    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmDashboardRepositoryImpl";
    private static final QCmDashboard cmDashboard = QCmDashboard.cmDashboard;

    /*
     * uiNm — Entity 에 추가된 컬럼이지만 Q클래스는 clean build 후 재생성됨.
     * 빌드 전에는 Expressions.stringPath 로 참조. 빌드 후 cmDashboard.uiNm 으로 대체 가능.
     */
    private static final StringPath UI_NM = Expressions.stringPath(cmDashboard, "uiNm");

    /* ── 공통 조건 헬퍼 ────────────────────────────────────── */

    private BooleanExpression andSiteNo(Map<String, Object> p) {
        Object v = p == null ? null : p.get("siteNo");
        return (v != null && !v.toString().isBlank()) ? cmDashboard.siteNo.eq(v.toString()) : null;
    }

    private BooleanExpression andUiNm(Map<String, Object> p) {
        Object v = p == null ? null : p.get("uiNm");
        if (v == null || v.toString().isBlank()) return null;
        return UI_NM.eq(v.toString());
    }

    /* ── 단일 조회 메서드 ──────────────────────────────────── */

    /**
     * compId 에 해당하는 차트 데이터를 조회한다.
     *
     * <p>p 에 {@code limit} 키(Number)가 있으면 결과 건수를 제한한다.</p>
     */
    @Override
    public List<CmDashboardDto> selectDashboard(String compId, Map<String, Object> p) {
        JPAQuery<CmDashboardDto> query = queryFactory
            .select(Projections.bean(CmDashboardDto.class,
                cmDashboard.dashboardId, cmDashboard.compId, cmDashboard.sortOrd, cmDashboard.yyyymmdd,
                cmDashboard.siteNo, cmDashboard.siteNm,
                UI_NM.as("uiNm"),
                cmDashboard.deptId, cmDashboard.deptNm, cmDashboard.userId, cmDashboard.userNm,
                cmDashboard.col1Nm, cmDashboard.col1Num,
                cmDashboard.col2Nm, cmDashboard.col2Num,
                cmDashboard.col3Nm, cmDashboard.col3Num,
                cmDashboard.col4Nm, cmDashboard.col4Num,
                cmDashboard.col5Nm, cmDashboard.col5Num,
                cmDashboard.col6Nm, cmDashboard.col6Num,
                cmDashboard.col7Nm, cmDashboard.col7Num,
                cmDashboard.col8Nm, cmDashboard.col8Num,
                cmDashboard.col9Nm, cmDashboard.col9Num))
            .from(cmDashboard)
            .setHint("org.hibernate.comment", QRY_SRC + " :: selectDashboard(" + compId + ")")
            .where(cmDashboard.compId.eq(compId), andSiteNo(p), andUiNm(p))
            .orderBy(new OrderSpecifier<>(Order.ASC, cmDashboard.sortOrd),
                     new OrderSpecifier<>(Order.ASC, cmDashboard.yyyymmdd),
                     new OrderSpecifier<>(Order.ASC, cmDashboard.dashboardId));

        Object limit = p == null ? null : p.get("limit");
        if (limit instanceof Number n) {
            query = query.limit(n.longValue());
        }

        return query.fetch();
    }
}
