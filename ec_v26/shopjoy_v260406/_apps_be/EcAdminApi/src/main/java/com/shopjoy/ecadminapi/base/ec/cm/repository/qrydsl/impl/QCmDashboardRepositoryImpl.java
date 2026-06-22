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
    private static final QCmDashboard d = QCmDashboard.cmDashboard;

    /*
     * uiNm — Entity 에 추가된 컬럼이지만 Q클래스는 clean build 후 재생성됨.
     * 빌드 전에는 Expressions.stringPath 로 참조. 빌드 후 d.uiNm 으로 대체 가능.
     */
    private static final StringPath UI_NM = Expressions.stringPath(d, "uiNm");

    /* ── 공통 조건 헬퍼 ────────────────────────────────────── */

    private BooleanExpression andSiteNo(Map<String, Object> p) {
        Object v = p == null ? null : p.get("siteNo");
        return (v != null && !v.toString().isBlank()) ? d.siteNo.eq(v.toString()) : null;
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
                d.dashboardId, d.compId, d.sortOrd, d.yyyymmdd,
                d.siteNo, d.siteNm,
                UI_NM.as("uiNm"),
                d.deptId, d.deptNm, d.userId, d.userNm,
                d.col1Nm, d.col1Num,
                d.col2Nm, d.col2Num,
                d.col3Nm, d.col3Num,
                d.col4Nm, d.col4Num,
                d.col5Nm, d.col5Num,
                d.col6Nm, d.col6Num,
                d.col7Nm, d.col7Num,
                d.col8Nm, d.col8Num,
                d.col9Nm, d.col9Num))
            .from(d)
            .setHint("org.hibernate.comment", QRY_SRC + " :: selectDashboard(" + compId + ")")
            .where(d.compId.eq(compId), andSiteNo(p), andUiNm(p))
            .orderBy(new OrderSpecifier<>(Order.ASC, d.sortOrd),
                     new OrderSpecifier<>(Order.ASC, d.yyyymmdd),
                     new OrderSpecifier<>(Order.ASC, d.dashboardId));

        Object limit = p == null ? null : p.get("limit");
        if (limit instanceof Number n) {
            query = query.limit(n.longValue());
        }

        return query.fetch();
    }
}
