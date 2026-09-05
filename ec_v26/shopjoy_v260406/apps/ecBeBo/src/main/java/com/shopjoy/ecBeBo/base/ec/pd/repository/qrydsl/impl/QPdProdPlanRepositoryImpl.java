package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdPlan;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdProdPlan;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdProdPlanRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/** PdProdPlan(상품 판매계획) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdPlanRepositoryImpl implements QPdProdPlanRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdPlanRepositoryImpl";
    private static final QPdProdPlan pdProdPlan = QPdProdPlan.pdProdPlan;

    @Override
    public List<PdProdPlan> selectActivePlans(LocalDateTime now, String excludeStatusCd) {
        return queryFactory.selectFrom(pdProdPlan)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectActivePlans()")
                .where(pdProdPlan.startDatetime.loe(now),
                        pdProdPlan.endDatetime.gt(now),
                        pdProdPlan.planStatusCd.ne(excludeStatusCd))
                .fetch();
    }
}
