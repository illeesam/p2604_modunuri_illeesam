package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdPlan;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdPlan;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdPlanRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** PdProdPlan(상품 판매계획) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdPlanRepositoryImpl implements QPdProdPlanRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdPlanRepositoryImpl";
    private static final QPdProdPlan pdProdPlan = QPdProdPlan.pdProdPlan;

    @Override
    public List<PdProdPlan> selectListByProdId(String prodId) {
        return queryFactory.selectFrom(pdProdPlan)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectListByProdId()")
                .where(pdProdPlan.prodId.eq(prodId))
                .orderBy(pdProdPlan.sortOrd.asc())
                .fetch();
    }

    @Override
    public List<PdProdPlan> selectActivePlans(java.time.LocalDateTime now) {
        return queryFactory.selectFrom(pdProdPlan)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectActivePlans()")
                .where(pdProdPlan.startDatetime.loe(now),
                        pdProdPlan.endDatetime.gt(now),
                        pdProdPlan.planStatusCd.ne("CANCELLED"))
                .fetch();
    }

    @Override
    public List<PdProdPlan> selectEndedActivePlans(java.time.LocalDateTime now) {
        return queryFactory.selectFrom(pdProdPlan)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectEndedActivePlans()")
                .where(pdProdPlan.planStatusCd.eq("ACTIVE"), pdProdPlan.endDatetime.loe(now))
                .fetch();
    }
}
