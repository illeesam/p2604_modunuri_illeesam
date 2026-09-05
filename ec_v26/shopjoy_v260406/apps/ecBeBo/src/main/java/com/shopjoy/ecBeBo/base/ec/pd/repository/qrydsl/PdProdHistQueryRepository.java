package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdHistDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdhProdChgHist;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdhProdSkuPriceHist;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdhProdSkuStockHist;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdhProdStatusHist;
import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
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
    private static final QVwSyCode            codeLookup    = new QVwSyCode("cd1");
    private static final QVwSyCode            codeAfterStatusCd    = new QVwSyCode("cd2");

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /** ── 연관 주문 (od_order_item JOIN od_order) ── */
    public List<PdProdHistDto.Item> selectOrders(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        order.orderId.as("orderId"), // 연관 주문ID (od_order.order_id)
                        order.memberId.as("memberId"), // 주문 회원ID
                        order.memberNm.as("memberNm"), // 주문 회원명 (조인 표시용)
                        order.orderDate.as("orderDate"), // 주문일시
                        order.totalAmt.as("totalAmt"), // 주문 총금액
                        order.orderStatusCd.as("orderStatusCd"), // 주문상태 — ORDER_STATUS_CD
                        codeLookup.codeLabel.as("orderStatusCdNm"), // 주문상태 코드라벨 (조인 표시용)
                        orderItem.orderQty.as("orderQty")))
                .from(orderItem)
                .join(order).on(order.orderId.eq(orderItem.orderId))
                .leftJoin(codeLookup).on(codeLookup.codeGrp.eq("ORDER_STATUS_CD").and(codeLookup.codeValue.eq(order.orderStatusCd)))
                .where(orderItem.prodId.eq(req.getProdId()),
                       dateBetween(req, "order_date", order.orderDate))
                .orderBy(order.orderDate.desc());
        applyPaging(query, req);
        return query.fetch();
    }

    /** ── 재고 이력 (pdh_prod_sku_stock_hist) ── */
    public List<PdProdHistDto.Item> selectStockHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        stockHist.histId.as("histId"), // 이력ID 필터 (하위 이력 테이블 PK 공용)
                        stockHist.prodId.as("prodId"), // 상품ID 필터 (필수 — 상품별 이력 조회)
                        stockHist.chgDate.as("histDate"), // 이력 발생일시 (재고/가격/상태/변경 이력 공통 chg_date·proc_date)
                        stockHist.chgBy.as("regBy"), // 처리자ID (chg_by/proc_user_id)
                        syUser.userNm.as("regByNm"), // 처리자명 (조인 표시용)
                        stockHist.chgReasonCd.as("stockTypeCd"), // 재고변동사유
                        codeLookup.codeLabel.as("stockTypeCdNm"), // 재고변동사유 코드라벨 (조인 표시용)
                        stockHist.chgQty.as("stockQty"), // 재고 변동 수량
                        stockHist.stockAfter.as("stockBalance"), // 변동 후 재고 잔량
                        stockHist.chgReason.as("stockMemo")))
                .from(stockHist)
                .leftJoin(syUser).on(syUser.userId.eq(stockHist.chgBy))
                .leftJoin(codeLookup).on(codeLookup.codeGrp.eq("CHG_REASON_CD").and(codeLookup.codeValue.eq(stockHist.chgReasonCd)))
                .where(stockHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", stockHist.chgDate))
                .orderBy(stockHist.chgDate.desc());
        applyPaging(query, req);
        return query.fetch();
    }

    /** ── 재고 이력 총건수 ── */
    public long countStockHist(PdProdHistDto.Request req) {
        Long cnt = queryFactory.select(stockHist.count())
                .from(stockHist)
                .where(stockHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", stockHist.chgDate))
                .fetchOne();
        return cnt != null ? cnt : 0L;
    }

    /** ── 가격 이력 (pdh_prod_sku_price_hist) ── */
    public List<PdProdHistDto.Item> selectPriceHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        priceHist.histId.as("histId"), // 이력ID 필터 (하위 이력 테이블 PK 공용)
                        priceHist.prodId.as("prodId"), // 상품ID 필터 (필수 — 상품별 이력 조회)
                        priceHist.chgDate.as("histDate"), // 이력 발생일시 (재고/가격/상태/변경 이력 공통 chg_date·proc_date)
                        priceHist.chgBy.as("regBy"), // 처리자ID (chg_by/proc_user_id)
                        syUser.userNm.as("regByNm"), // 처리자명 (조인 표시용)
                        priceHist.chgReason.as("priceField"), // 가격 변경 항목명 (chg_reason)
                        priceHist.addPriceBefore.stringValue().as("priceBefore"),
                        priceHist.addPriceAfter.stringValue().as("priceAfter")))
                .from(priceHist)
                .leftJoin(syUser).on(syUser.userId.eq(priceHist.chgBy))
                .where(priceHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", priceHist.chgDate))
                .orderBy(priceHist.chgDate.desc());
        applyPaging(query, req);
        return query.fetch();
    }

    /** ── 가격 이력 총건수 ── */
    public long countPriceHist(PdProdHistDto.Request req) {
        Long cnt = queryFactory.select(priceHist.count())
                .from(priceHist)
                .where(priceHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", priceHist.chgDate))
                .fetchOne();
        return cnt != null ? cnt : 0L;
    }

    /** ── 상태 이력 (pdh_prod_status_hist) ── */
    public List<PdProdHistDto.Item> selectStatusHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        statusHist.prodStatusHistId.as("histId"), // 이력ID 필터 (하위 이력 테이블 PK 공용)
                        statusHist.prodId.as("prodId"), // 상품ID 필터 (필수 — 상품별 이력 조회)
                        statusHist.procDate.as("histDate"), // 이력 발생일시 (재고/가격/상태/변경 이력 공통 chg_date·proc_date)
                        statusHist.procUserId.as("regBy"), // 처리자ID (chg_by/proc_user_id)
                        syUser.userNm.as("regByNm"), // 처리자명 (조인 표시용)
                        statusHist.beforeStatusCd.as("statusCdBefore"), // 변경 전 상품상태
                        codeLookup.codeLabel.as("statusCdBeforeNm"), // 변경 전 상품상태 코드라벨 (조인 표시용)
                        statusHist.afterStatusCd.as("statusCdAfter"), // 변경 후 상품상태
                        codeAfterStatusCd.codeLabel.as("statusCdAfterNm")))
                .from(statusHist)
                .leftJoin(syUser).on(syUser.userId.eq(statusHist.procUserId))
                .leftJoin(codeLookup).on(codeLookup.codeGrp.eq("PRODUCT_STATUS").and(codeLookup.codeValue.eq(statusHist.beforeStatusCd)))
                .leftJoin(codeAfterStatusCd).on(codeAfterStatusCd.codeGrp.eq("PRODUCT_STATUS").and(codeAfterStatusCd.codeValue.eq(statusHist.afterStatusCd)))
                .where(statusHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "proc_date", statusHist.procDate))
                .orderBy(statusHist.procDate.desc());
        applyPaging(query, req);
        return query.fetch();
    }

    /** ── 상태 이력 총건수 ── */
    public long countStatusHist(PdProdHistDto.Request req) {
        Long cnt = queryFactory.select(statusHist.count())
                .from(statusHist)
                .where(statusHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "proc_date", statusHist.procDate))
                .fetchOne();
        return cnt != null ? cnt : 0L;
    }

    /** ── 변경 이력 (pdh_prod_chg_hist) ── */
    public List<PdProdHistDto.Item> selectChangeHist(PdProdHistDto.Request req) {
        JPAQuery<PdProdHistDto.Item> query = queryFactory
                .select(Projections.bean(PdProdHistDto.Item.class,
                        chgHist.prodChgHistId.as("histId"), // 이력ID 필터 (하위 이력 테이블 PK 공용)
                        chgHist.prodId.as("prodId"), // 상품ID 필터 (필수 — 상품별 이력 조회)
                        chgHist.chgDate.as("histDate"), // 이력 발생일시 (재고/가격/상태/변경 이력 공통 chg_date·proc_date)
                        chgHist.chgUserId.as("regBy"), // 처리자ID (chg_by/proc_user_id)
                        syUser.userNm.as("regByNm"), // 처리자명 (조인 표시용)
                        chgHist.chgTypeCd.as("changeField"), // 변경 항목 유형코드 (chg_type_cd — 일반 상품정보 변경 이력)
                        chgHist.beforeVal.as("changeBefore"), // 변경 전 값
                        chgHist.afterVal.as("changeAfter")))
                .from(chgHist)
                .leftJoin(syUser).on(syUser.userId.eq(chgHist.chgUserId))
                .where(chgHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", chgHist.chgDate))
                .orderBy(chgHist.chgDate.desc());
        applyPaging(query, req);
        return query.fetch();
    }

    /** ── 변경 이력 총건수 ── */
    public long countChangeHist(PdProdHistDto.Request req) {
        Long cnt = queryFactory.select(chgHist.count())
                .from(chgHist)
                .where(chgHist.prodId.eq(req.getProdId()),
                       dateBetween(req, "chg_date", chgHist.chgDate))
                .fetchOne();
        return cnt != null ? cnt : 0L;
    }

    /**
     * dateRangeType 이 지정한 컬럼명과 일치할 때만 [dateRangeStart 00:00:00, dateRangeEnd 23:59:59.999999] 범위 조건 생성.
     * 일치하지 않거나 값이 비면 null 반환 → BooleanBuilder 에서 조건 무시.
     */
    private com.querydsl.core.types.Predicate dateBetween(
            PdProdHistDto.Request req, String column,
            com.querydsl.core.types.dsl.DateTimePath<LocalDateTime> path) {
        if (req == null) return null;
        String dateRangeType  = req.getDateRangeType();
        String dateRangeStart = req.getDateRangeStart();
        String dateRangeEnd   = req.getDateRangeEnd();
        if (!StringUtils.hasText(dateRangeType) || !column.equals(dateRangeType)) return null;
        if (!StringUtils.hasText(dateRangeStart) || !StringUtils.hasText(dateRangeEnd)) return null;

        /* 23:59:59.999999(나노초까지) — SQL 로그에 검색한 날짜(start~end) 그대로 찍힘 (QdslUtil.dateBetween 과 동일 패턴) */
        LocalDateTime start = LocalDate.parse(dateRangeStart, DT_FMT).atTime(0, 0, 0, 0);
        LocalDateTime end   = LocalDate.parse(dateRangeEnd, DT_FMT).atTime(23, 59, 59, 999_999_999);
        return new BooleanBuilder().and(path.goe(start)).and(path.loe(end));
    }

    /* applyPaging — PageHelper.addPaging(req) 가 채운 limit/offset 적용 (PdProdHistService 에서 선행 호출) */
    private void applyPaging(JPAQuery<?> query, PdProdHistDto.Request req) {
        if (req == null) return;
        if (req.getLimit() != null && req.getLimit() > 0) {
            query.limit(req.getLimit());
        }
        if (req.getOffset() != null && req.getOffset() > 0) {
            query.offset(req.getOffset());
        }
    }
}
