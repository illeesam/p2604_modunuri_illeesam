package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveProdRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** PmSaveProd(상품-적립금 전개) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveProdRepositoryImpl implements QPmSaveProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSaveProdRepositoryImpl";
    private static final QPmSaveProd pmSaveProd = QPmSaveProd.pmSaveProd;

    @Override
    public List<String> selectSaveIdsByProdId(String prodId) {
        return queryFactory.select(pmSaveProd.saveId)
                .from(pmSaveProd)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectSaveIdsByProdId()")
                .where(pmSaveProd.prodId.eq(prodId))
                .fetch();
    }

    @Override
    public long deleteAllBySaveIds(List<String> saveIds) {
        return queryFactory.delete(pmSaveProd)
                .where(pmSaveProd.saveId.in(saveIds))
                .execute();
    }
}
