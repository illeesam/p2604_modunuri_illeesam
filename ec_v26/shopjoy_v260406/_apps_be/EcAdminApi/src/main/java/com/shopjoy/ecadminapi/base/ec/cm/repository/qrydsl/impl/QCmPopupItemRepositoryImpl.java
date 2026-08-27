package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopupItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmPopupItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmPopupItemRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** CmPopupItem(공통 선택/조회 팝업 항목) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmPopupItemRepositoryImpl implements QCmPopupItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmPopupItemRepositoryImpl";
    private static final QCmPopupItem cmPopupItem = QCmPopupItem.cmPopupItem;

    @Override
    public List<CmPopupItem> selectList(String popupId, String useYn) {
        return queryFactory.selectFrom(cmPopupItem)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(cmPopupItem.popupId.eq(popupId),
                        useYn != null && !useYn.isBlank() ? cmPopupItem.useYn.eq(useYn) : null)
                .orderBy(cmPopupItem.sortOrd.asc())
                .fetch();
    }
}
