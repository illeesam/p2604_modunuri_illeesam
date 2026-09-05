package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponProdRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** PmCouponProd(상품-쿠폰 전개) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponProdRepositoryImpl implements QPmCouponProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponProdRepositoryImpl";
    private static final QPmCouponProd pmCouponProd = QPmCouponProd.pmCouponProd;

    @Override
    public List<String> selectCouponIdsByProdId(String prodId) {
        return queryFactory.select(pmCouponProd.couponId)
                .from(pmCouponProd)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectCouponIdsByProdId()")
                .where(pmCouponProd.prodId.eq(prodId))
                .fetch();
    }

    @Override
    public long deleteAllByCouponIds(List<String> couponIds) {
        return queryFactory.delete(pmCouponProd)
                .where(pmCouponProd.couponId.in(couponIds))
                .execute();
    }
}
