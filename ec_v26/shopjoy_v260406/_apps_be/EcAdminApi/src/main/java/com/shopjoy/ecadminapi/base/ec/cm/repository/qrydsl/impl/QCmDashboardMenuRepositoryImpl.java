package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardMenu;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmDashboardMenu;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardMenuRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** CmDashboardMenu(대시보드 좌측 메뉴 트리 — 개인/공통) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmDashboardMenuRepositoryImpl implements QCmDashboardMenuRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmDashboardMenuRepositoryImpl";
    private static final QCmDashboardMenu cmDashboardMenu = QCmDashboardMenu.cmDashboardMenu;

    @Override
    public List<CmDashboardMenu> selectList(String menuScopeCd, String ownerUserId) {
        return queryFactory.selectFrom(cmDashboardMenu)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(cmDashboardMenu.menuScopeCd.eq(menuScopeCd),
                        ownerUserId != null && !ownerUserId.isBlank() ? cmDashboardMenu.ownerUserId.eq(ownerUserId) : null)
                .orderBy(cmDashboardMenu.sortOrd.asc())
                .fetch();
    }
}
