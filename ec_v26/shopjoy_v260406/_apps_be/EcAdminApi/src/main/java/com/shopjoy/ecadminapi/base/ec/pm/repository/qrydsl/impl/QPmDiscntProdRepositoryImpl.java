package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntProdRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** PmDiscntProd(상품-할인 전개) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntProdRepositoryImpl implements QPmDiscntProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmDiscntProdRepositoryImpl";
    private static final QPmDiscntProd pmDiscntProd = QPmDiscntProd.pmDiscntProd;

    @Override
    public List<String> selectDiscntIdsByProdId(String prodId) {
        return queryFactory.select(pmDiscntProd.discntId)
                .from(pmDiscntProd)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectDiscntIdsByProdId()")
                .where(pmDiscntProd.prodId.eq(prodId))
                .fetch();
    }

    @Override
    public long deleteAllByDiscntIds(List<String> discntIds) {
        return queryFactory.delete(pmDiscntProd)
                .where(pmDiscntProd.discntId.in(discntIds))
                .execute();
    }
}
