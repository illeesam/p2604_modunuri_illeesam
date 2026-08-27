package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

/** CmDashboard(대시보드 헤더 — 화면 단위 정의) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmDashboardRepositoryImpl implements QCmDashboardRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmDashboardRepositoryImpl";
    private static final QCmDashboard cmDashboard = QCmDashboard.cmDashboard;

    @Override
    public List<CmDashboard> selectList(String useYn) {
        return queryFactory.selectFrom(cmDashboard)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(useYn != null && !useYn.isBlank() ? cmDashboard.useYn.eq(useYn) : null)
                .orderBy(cmDashboard.sortOrd.asc())
                .fetch();
    }

    @Override
    public Optional<CmDashboard> selectByUiCompNm(String uiCompNm) {
        CmDashboard result = queryFactory.selectFrom(cmDashboard)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectByUiCompNm()")
                .where(cmDashboard.uiCompNm.eq(uiCompNm))
                .fetchOne();
        return Optional.ofNullable(result);
    }
}
