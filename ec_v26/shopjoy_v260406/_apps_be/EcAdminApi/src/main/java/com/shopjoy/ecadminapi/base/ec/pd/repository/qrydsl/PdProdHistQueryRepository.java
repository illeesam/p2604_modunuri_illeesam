package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
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

    private static final QOdOrder            o     = QOdOrder.odOrder;
    private static final QOdOrderItem        oi    = QOdOrderItem.odOrderItem;
    private static final QPdhProdSkuStockHist sh   = QPdhProdSkuStockHist.pdhProdSkuStockHist;
    private static final QPdhProdSkuPriceHist ph   = QPdhProdSkuPriceHist.pdhProdSkuPriceHist;
    private static final QPdhProdStatusHist  sth   = QPdhProdStatusHist.pdhProdStatusHist;
    private static final QPdhProdChgHist     ch    = QPdhProdChgHist.pdhProdChgHist;
    private static final QSyUser             usr   = QSyUser.syUser;
    private static final QSyCode             cd1   = new QSyCode("cd1");
    private static final QSyCode             cd2   = new QSyCode("cd2");

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /** ── 연관 주문 (od_order_item JOIN od_order) ── */
    public List<PdProdHistDto.Item> selectOrders(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        o.orderId.as("orderId"),
                        o.memberId.as("memberId"),
                        o.memberNm.as("memberNm"),
                        o.orderDate.as("orderDate"),
                        o.totalAmt.as("totalAmt"),
                        o.orderStatusCd.as("orderStatusCd"),
                        cd1.codeLabel.as("orderStatusCdNm"),
                        oi.orderQty.as("orderQty")))
                .from(oi)
                .join(o).on(o.orderId.eq(oi.orderId))
                .leftJoin(cd1).on(cd1.codeGrp.eq("ORDER_STATUS").and(cd1.codeValue.eq(o.orderStatusCd)))
                .where(oi.prodId.eq(req.getProdId()),
                       dateBetween(req, "order_date", o.orderDate))
                .orderBy(o.orderDate.desc());
        applyLimit(query, req);
        return query.fetch();
    }

    /** ── 재고 이력 (pdh_prod_sku_stock_hist) ── */
    public List<PdProdHistDto.Item> selectStockHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        sh.histId.as("histId"),
                        sh.prodId.as("prodId"),
                        sh.chgDate.as("histDate"),
                        sh.chgBy.as("regBy"),
                        usr.userNm.as("regByNm"),
                        sh.chgReasonCd.as("stockTypeCd"),
                        cd1.codeLabel.as("stockTypeCdNm"),
                        sh.chgQty.as("stockQty"),
                        sh.stockAfter.as("stockBalance"),
                        sh.chgReason.as("stockMemo")))
                .from(sh)
                .leftJoin(usr).on(usr.userId.eq(sh.chgBy))
                .leftJoin(cd1).on(cd1.codeGrp.eq("SKU_STOCK_CHG").and(cd1.codeValue.eq(sh.chgReasonCd)))
                .where(sh.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", sh.chgDate))
                .orderBy(sh.chgDate.desc());
        applyLimit(query, req);
        return query.fetch();
    }

    /** ── 가격 이력 (pdh_prod_sku_price_hist) ── */
    public List<PdProdHistDto.Item> selectPriceHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        ph.histId.as("histId"),
                        ph.prodId.as("prodId"),
                        ph.chgDate.as("histDate"),
                        ph.chgBy.as("regBy"),
                        usr.userNm.as("regByNm"),
                        ph.chgReason.as("priceField"),
                        ph.addPriceBefore.stringValue().as("priceBefore"),
                        ph.addPriceAfter.stringValue().as("priceAfter")))
                .from(ph)
                .leftJoin(usr).on(usr.userId.eq(ph.chgBy))
                .where(ph.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", ph.chgDate))
                .orderBy(ph.chgDate.desc());
        applyLimit(query, req);
        return query.fetch();
    }

    /** ── 상태 이력 (pdh_prod_status_hist) ── */
    public List<PdProdHistDto.Item> selectStatusHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        sth.prodStatusHistId.as("histId"),
                        sth.prodId.as("prodId"),
                        sth.procDate.as("histDate"),
                        sth.procUserId.as("regBy"),
                        usr.userNm.as("regByNm"),
                        sth.beforeStatusCd.as("statusCdBefore"),
                        cd1.codeLabel.as("statusCdBeforeNm"),
                        sth.afterStatusCd.as("statusCdAfter"),
                        cd2.codeLabel.as("statusCdAfterNm")))
                .from(sth)
                .leftJoin(usr).on(usr.userId.eq(sth.procUserId))
                .leftJoin(cd1).on(cd1.codeGrp.eq("PRODUCT_STATUS").and(cd1.codeValue.eq(sth.beforeStatusCd)))
                .leftJoin(cd2).on(cd2.codeGrp.eq("PRODUCT_STATUS").and(cd2.codeValue.eq(sth.afterStatusCd)))
                .where(sth.prodId.eq(req.getProdId()),
                       dateBetween(req, "proc_date", sth.procDate))
                .orderBy(sth.procDate.desc());
        applyLimit(query, req);
        return query.fetch();
    }

    /** ── 변경 이력 (pdh_prod_chg_hist) ── */
    public List<PdProdHistDto.Item> selectChangeHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        ch.prodChgHistId.as("histId"),
                        ch.prodId.as("prodId"),
                        ch.chgDate.as("histDate"),
                        ch.chgUserId.as("regBy"),
                        usr.userNm.as("regByNm"),
                        ch.chgTypeCd.as("changeField"),
                        ch.beforeVal.as("changeBefore"),
                        ch.afterVal.as("changeAfter")))
                .from(ch)
                .leftJoin(usr).on(usr.userId.eq(ch.chgUserId))
                .where(ch.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", ch.chgDate))
                .orderBy(ch.chgDate.desc());
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

    private void applyLimit(JPAQuery<?> query, PdProdHistDto.Request req) {
        if (req != null && req.getLimit() != null && req.getLimit() > 0) {
            query.limit(req.getLimit());
        }
    }
}
