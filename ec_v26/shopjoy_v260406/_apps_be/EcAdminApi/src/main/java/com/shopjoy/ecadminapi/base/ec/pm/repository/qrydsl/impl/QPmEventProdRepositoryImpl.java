package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEventProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventProdRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** PmEventProd(상품-이벤트 전개) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventProdRepositoryImpl implements QPmEventProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmEventProdRepositoryImpl";
    private static final QPmEventProd pmEventProd = QPmEventProd.pmEventProd;

    @Override
    public List<String> selectEventIdsByProdId(String prodId) {
        return queryFactory.select(pmEventProd.eventId)
                .from(pmEventProd)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectEventIdsByProdId()")
                .where(pmEventProd.prodId.eq(prodId))
                .fetch();
    }

    @Override
    public long deleteAllByEventIds(List<String> eventIds) {
        return queryFactory.delete(pmEventProd)
                .where(pmEventProd.eventId.in(eventIds))
                .execute();
    }
}
