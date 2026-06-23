package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdSkuStockHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdStatusHist;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 상품 이력 조회 전용 QueryDSL Repository.
 * (기존 MyBatis PdProdHistMapper.xml 대체 — 다중 엔티티 조인 조회)
 */
@Repository
@RequiredArgsConstructor
public class PdProdHistQueryRepository {

    private final JPAQueryFactory queryFactory;

    private static final QOdOrder             order      = QOdOrder.odOrder;
    private static final QOdOrderItem         orderItem  = QOdOrderItem.odOrderItem;
    private static final QPdhProdSkuStockHist stockHist  = QPdhProdSkuStockHist.pdhProdSkuStockHist;
    private static final QPdhProdSkuPriceHist priceHist  = QPdhProdSkuPriceHist.pdhProdSkuPriceHist;
    private static final QPdhProdStatusHist   statusHist = QPdhProdStatusHist.pdhProdStatusHist;
    private static final QPdhProdChgHist      chgHist    = QPdhProdChgHist.pdhProdChgHist;
    private static final QSyUser              syUser     = QSyUser.syUser;
    private static final QSyCode              syCode1    = new QSyCode("cd1");
    private static final QSyCode              syCode2    = new QSyCode("cd2");

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /** ── 연관 주문 (od_order_item JOIN od_order) ── */
    public List<PdProdHistDto.Item> selectOrders(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        order.orderId.as("orderId"),
                        order.memberId.as("memberId"),
                        order.memberNm.as("memberNm"),
                        order.orderDate.as("orderDate"),
                        order.totalAmt.as("totalAmt"),
                        order.orderStatusCd.as("orderStatusCd"),
                        syCode1.codeLabel.as("orderStatusCdNm"),
                        orderItem.orderQty.as("orderQty")))
                .from(orderItem)
                .join(order).on(order.orderId.eq(orderItem.orderId))
                .leftJoin(syCode1).on(syCode1.codeGrp.eq("ORDER_STATUS").and(syCode1.codeValue.eq(order.orderStatusCd)))
                .where(orderItem.prodId.eq(req.getProdId()),
                       dateBetween(req, "order_date", order.orderDate))
                .orderBy(order.orderDate.desc());
        applyLimit(query, req);
        return query.fetch();
    }

    /** ── 재고 이력 (pdh_prod_sku_stock_hist) ── */
    public List<PdProdHistDto.Item> selectStockHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        stockHist.histId.as("histId"),
                        stockHist.prodId.as("prodId"),
                        stockHist.chgDate.as("histDate"),
                        stockHist.chgBy.as("regBy"),
                        syUser.userNm.as("regByNm"),
                        stockHist.chgReasonCd.as("stockTypeCd"),
                        syCode1.codeLabel.as("stockTypeCdNm"),
                        stockHist.chgQty.as("stockQty"),
                        stockHist.stockAfter.as("stockBalance"),
                        stockHist.chgReason.as("stockMemo")))
                .from(stockHist)
                .leftJoin(syUser).on(syUser.userId.eq(stockHist.chgBy))
                .leftJoin(syCode1).on(syCode1.codeGrp.eq("SKU_STOCK_CHG").and(syCode1.codeValue.eq(stockHist.chgReasonCd)))
                .where(stockHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", stockHist.chgDate))
                .orderBy(stockHist.chgDate.desc());
        applyLimit(query, req);
        return query.fetch();
    }

    /** ── 가격 이력 (pdh_prod_sku_price_hist) ── */
    public List<PdProdHistDto.Item> selectPriceHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        priceHist.histId.as("histId"),
                        priceHist.prodId.as("prodId"),
                        priceHist.chgDate.as("histDate"),
                        priceHist.chgBy.as("regBy"),
                        syUser.userNm.as("regByNm"),
                        priceHist.chgReason.as("priceField"),
                        priceHist.addPriceBefore.stringValue().as("priceBefore"),
                        priceHist.addPriceAfter.stringValue().as("priceAfter")))
                .from(priceHist)
                .leftJoin(syUser).on(syUser.userId.eq(priceHist.chgBy))
                .where(priceHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", priceHist.chgDate))
                .orderBy(priceHist.chgDate.desc());
        applyLimit(query, req);
        return query.fetch();
    }

    /** ── 상태 이력 (pdh_prod_status_hist) ── */
    public List<PdProdHistDto.Item> selectStatusHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        statusHist.prodStatusHistId.as("histId"),
                        statusHist.prodId.as("prodId"),
                        statusHist.procDate.as("histDate"),
                        statusHist.procUserId.as("regBy"),
                        syUser.userNm.as("regByNm"),
                        statusHist.beforeStatusCd.as("statusCdBefore"),
                        syCode1.codeLabel.as("statusCdBeforeNm"),
                        statusHist.afterStatusCd.as("statusCdAfter"),
                        syCode2.codeLabel.as("statusCdAfterNm")))
                .from(statusHist)
                .leftJoin(syUser).on(syUser.userId.eq(statusHist.procUserId))
                .leftJoin(syCode1).on(syCode1.codeGrp.eq("PRODUCT_STATUS").and(syCode1.codeValue.eq(statusHist.beforeStatusCd)))
                .leftJoin(syCode2).on(syCode2.codeGrp.eq("PRODUCT_STATUS").and(syCode2.codeValue.eq(statusHist.afterStatusCd)))
                .where(statusHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "proc_date", statusHist.procDate))
                .orderBy(statusHist.procDate.desc());
        applyLimit(query, req);
        return query.fetch();
    }

    /** ── 변경 이력 (pdh_prod_chg_hist) ── */
    public List<PdProdHistDto.Item> selectChangeHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        chgHist.prodChgHistId.as("histId"),
                        chgHist.prodId.as("prodId"),
                        chgHist.chgDate.as("histDate"),
                        chgHist.chgUserId.as("regBy"),
                        syUser.userNm.as("regByNm"),
                        chgHist.chgTypeCd.as("changeField"),
                        chgHist.beforeVal.as("changeBefore"),
                        chgHist.afterVal.as("changeAfter")))
                .from(chgHist)
                .leftJoin(syUser).on(syUser.userId.eq(chgHist.chgUserId))
                .where(chgHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", chgHist.chgDate))
                .orderBy(chgHist.chgDate.desc());
        applyLimit(query, req);
        return query.fetch();
    }

    /**
     * dateType 이 지정한 컬럼명과 일치할 때만 [dateStart, dateEnd+1day) 범위 조건 생성.
     * 일치하지 않거나 값이 비면 null 반환 → BooleanBuilder 에서 조건 무시.
     */
    private com.querydsl.core.types.Predicate dateBetween(
            PdProdHistDto.Request req, String column,
            com.querydsl.core.types.dsl.DateTimePath<LocalDateTime> path) {
        if (req == null) return null;
        String dateType  = req.getDateType();
        String dateStart = req.getDateStart();
        String dateEnd   = req.getDateEnd();
        if (!StringUtils.hasText(dateType) || !column.equals(dateType)) return null;
        if (!StringUtils.hasText(dateStart) || !StringUtils.hasText(dateEnd)) return null;

        LocalDateTime start   = LocalDate.parse(dateStart, DT_FMT).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(dateEnd, DT_FMT).plusDays(1).atStartOfDay();
        return new BooleanBuilder().and(path.goe(start)).and(path.lt(endExcl));
    }

    /* applyLimit */
    private void applyLimit(JPAQuery<?> query, PdProdHistDto.Request req) {
        if (req != null && req.getLimit() != null && req.getLimit() > 0) {
            query.limit(req.getLimit());
        }
    }
}
