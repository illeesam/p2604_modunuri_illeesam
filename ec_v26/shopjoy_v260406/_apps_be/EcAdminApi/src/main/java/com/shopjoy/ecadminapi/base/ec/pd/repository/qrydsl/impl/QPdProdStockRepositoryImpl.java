package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdStock;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdStock;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdStockRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Optional;

/** PdProdStock QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdStockRepositoryImpl implements QPdProdStockRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdStock sc = QPdProdStock.pdProdStock;

    @Override
    public Optional<PdProdStock> selectByStockCode(String stockCode) {
        PdProdStock result = queryFactory
                .selectFrom(sc)
                .where(sc.stockCode.eq(stockCode))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    @Override
    public int decreaseStock(String stockCode, int qty) {
        return (int) queryFactory
                .update(sc)
                .set(sc.stockQty, sc.stockQty.subtract(qty))
                .set(sc.updDate, LocalDateTime.now())
                .where(sc.stockCode.eq(stockCode)
                        .and(sc.stockQty.goe(qty)))
                .execute();
    }

    @Override
    public int increaseStock(String stockCode, int qty) {
        return (int) queryFactory
                .update(sc)
                .set(sc.stockQty, sc.stockQty.add(qty))
                .set(sc.updDate, LocalDateTime.now())
                .where(sc.stockCode.eq(stockCode))
                .execute();
    }

    @Override
    public int increaseSaleCount(String stockCode, int qty) {
        return (int) queryFactory
                .update(sc)
                .set(sc.saleCount, sc.saleCount.add(qty))
                .set(sc.updDate, LocalDateTime.now())
                .where(sc.stockCode.eq(stockCode))
                .execute();
    }

    @Override
    public int updateSelective(PdProdStock entity) {
        JPAUpdateClause update = queryFactory.update(sc)
                .where(sc.prodStockId.eq(entity.getProdStockId()));
        boolean hasAny = false;
        if (entity.getStockQty()  != null) { update.set(sc.stockQty,  entity.getStockQty());  hasAny = true; }
        if (entity.getSaleCount() != null) { update.set(sc.saleCount, entity.getSaleCount()); hasAny = true; }
        if (entity.getProdId()    != null) { update.set(sc.prodId,    entity.getProdId());    hasAny = true; }
        if (entity.getUpdBy()     != null) { update.set(sc.updBy,     entity.getUpdBy());     hasAny = true; }
        if (entity.getUpdDate()   != null) { update.set(sc.updDate,   entity.getUpdDate());   hasAny = true; }
        return hasAny ? (int) update.execute() : 0;
    }
}
