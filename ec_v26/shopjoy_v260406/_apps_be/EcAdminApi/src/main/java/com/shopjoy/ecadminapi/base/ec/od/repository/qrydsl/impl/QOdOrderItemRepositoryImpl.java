package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderItemRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSku;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdOrderItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderItemRepositoryImpl implements QOdOrderItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdOrderItem   oi   = QOdOrderItem.odOrderItem;
    private static final QPdProd        p    = QPdProd.pdProd;
    private static final QPdProdSku     sk   = QPdProdSku.pdProdSku;
    private static final QPdProdOptItem oi1  = new QPdProdOptItem("oi1");
    private static final QPdProdOptItem oi2  = new QPdProdOptItem("oi2");
    private static final QSyCode        cdIs = new QSyCode("cd_is");
    private static final QSyCode        cdDc = new QSyCode("cd_dc");

    /* 주문 아이템(상품) 키조회 */
    @Override
    public Optional<OdOrderItemDto.Item> selectById(String orderItemId) {
        OdOrderItemDto.Item dto = baseQuery()
                .where(oi.orderItemId.eq(orderItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 아이템(상품) 목록조회 */
    @Override
    public List<OdOrderItemDto.Item> selectList(OdOrderItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderItemDto.Item> query = baseQuery().where(
                andOrderIds(search),
                andOrderId(search),
                andSiteId(search),
                andOrderItemId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 주문 아이템(상품) 페이지조회 */
    @Override
    public OdOrderItemDto.PageResponse selectPageList(OdOrderItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderItemDto.Item> query = baseQuery().where(
                andOrderIds(search),
                andOrderId(search),
                andSiteId(search),
                andOrderItemId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdOrderItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(oi.count())
                .from(oi)
                .where(
                andOrderIds(search),
                andOrderId(search),
                andSiteId(search),
                andOrderItemId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        OdOrderItemDto.PageResponse res = new OdOrderItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 주문 아이템(상품) baseQuery */
    private JPAQuery<OdOrderItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderItemDto.Item.class,
                        oi.orderItemId, oi.siteId, oi.orderId, oi.prodId, oi.skuId,
                        oi.optItemId1, oi.optItemId2, oi.prodNm, oi.brandNm, oi.dlivTmpltId,
                        oi.normalPrice, oi.unitPrice, oi.orderQty, oi.itemOrderAmt,
                        oi.cancelQty, oi.itemCancelAmt, oi.completQty, oi.itemCompletedAmt,
                        oi.orgUnitPrice, oi.orgItemOrderAmt, oi.orgDiscountAmt, oi.orgShippingFee,
                        oi.saveRate, oi.saveUseAmt, oi.saveSchdAmt,
                        oi.orderItemStatusCd, oi.orderItemStatusCdBefore,
                        oi.claimYn, oi.buyConfirmYn, oi.buyConfirmSchdDate, oi.buyConfirmDate,
                        oi.settleYn, oi.settleDate,
                        oi.reserveSaleYn, oi.reserveDlivSchdDate,
                        oi.bundleGroupId, oi.bundlePriceRate, oi.giftId,
                        oi.outboundShippingFee, oi.dlivCourierCd, oi.dlivTrackingNo, oi.dlivShipDate,
                        oi.regBy, oi.regDate, oi.updBy, oi.updDate,
                        p.thumbnailUrl.as("thumbnailUrl"),
                        p.salePrice.as("salePriceCurrent"),
                        p.prodNm.as("prodNmCurrent"),
                        sk.skuCode.as("skuCode"),
                        oi1.optNm.as("optItemNm1"),
                        oi2.optNm.as("optItemNm2"),
                        cdIs.codeLabel.as("orderItemStatusCdNm"),
                        cdDc.codeLabel.as("dlivCourierCdNm")
                ))
                .from(oi)
                .leftJoin(p).on(p.prodId.eq(oi.prodId))
                .leftJoin(sk).on(sk.skuId.eq(oi.skuId))
                .leftJoin(oi1).on(oi1.optItemId.eq(oi.optItemId1))
                .leftJoin(oi2).on(oi2.optItemId.eq(oi.optItemId2))
                .leftJoin(cdIs).on(cdIs.codeGrp.eq("ORDER_ITEM_STATUS").and(cdIs.codeValue.eq(oi.orderItemStatusCd)))
                .leftJoin(cdDc).on(cdDc.codeGrp.eq("COURIER").and(cdDc.codeValue.eq(oi.dlivCourierCd)));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* orderId IN */
    private BooleanExpression andOrderIds(OdOrderItemDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getOrderIds())
                ? oi.orderId.in(search.getOrderIds()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression andOrderId(OdOrderItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? oi.orderId.eq(search.getOrderId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdOrderItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? oi.siteId.eq(search.getSiteId()) : null;
    }

    /* orderItemId 정확 일치 */
    private BooleanExpression andOrderItemId(OdOrderItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderItemId())
                ? oi.orderItemId.eq(search.getOrderItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(OdOrderItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return oi.regDate.goe(start).and(oi.regDate.lt(endExcl));
            case "upd_date": return oi.updDate.goe(start).and(oi.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdOrderItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",brandNm,", oi.brandNm, pattern);
        or = orLike(or, all, types, ",bundleGroupId,", oi.bundleGroupId, pattern);
        or = orLike(or, all, types, ",buyConfirmYn,", oi.buyConfirmYn, pattern);
        or = orLike(or, all, types, ",claimYn,", oi.claimYn, pattern);
        or = orLike(or, all, types, ",dlivCourierCd,", oi.dlivCourierCd, pattern);
        or = orLike(or, all, types, ",dlivTmpltId,", oi.dlivTmpltId, pattern);
        or = orLike(or, all, types, ",dlivTrackingNo,", oi.dlivTrackingNo, pattern);
        or = orLike(or, all, types, ",giftId,", oi.giftId, pattern);
        or = orLike(or, all, types, ",optItemId1,", oi.optItemId1, pattern);
        or = orLike(or, all, types, ",optItemId2,", oi.optItemId2, pattern);
        or = orLike(or, all, types, ",orderId,", oi.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", oi.orderItemId, pattern);
        or = orLike(or, all, types, ",orderItemStatusCd,", oi.orderItemStatusCd, pattern);
        or = orLike(or, all, types, ",orderItemStatusCdBefore,", oi.orderItemStatusCdBefore, pattern);
        or = orLike(or, all, types, ",prodId,", oi.prodId, pattern);
        or = orLike(or, all, types, ",prodNm,", oi.prodNm, pattern);
        or = orLike(or, all, types, ",reserveSaleYn,", oi.reserveSaleYn, pattern);
        or = orLike(or, all, types, ",settleYn,", oi.settleYn, pattern);
        or = orLike(or, all, types, ",siteId,", oi.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", oi.skuId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdOrderItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, oi.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, oi.orderItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, oi.orderItemId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, oi.prodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, oi.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, oi.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, oi.orderItemId));
        }
        return orders;
    }

    /* 주문 아이템(상품) 수정 */
    @Override
    public int updateSelective(OdOrderItem entity) {
        if (entity.getOrderItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(oi);
        boolean hasAny = false;

        if (entity.getOrderItemStatusCd()       != null) { update.set(oi.orderItemStatusCd,       entity.getOrderItemStatusCd());       hasAny = true; }
        if (entity.getOrderItemStatusCdBefore() != null) { update.set(oi.orderItemStatusCdBefore, entity.getOrderItemStatusCdBefore()); hasAny = true; }
        if (entity.getBuyConfirmYn()            != null) { update.set(oi.buyConfirmYn,            entity.getBuyConfirmYn());            hasAny = true; }
        if (entity.getBuyConfirmDate()          != null) { update.set(oi.buyConfirmDate,          entity.getBuyConfirmDate());          hasAny = true; }
        if (entity.getSettleYn()                != null) { update.set(oi.settleYn,                entity.getSettleYn());                hasAny = true; }
        if (entity.getSettleDate()              != null) { update.set(oi.settleDate,              entity.getSettleDate());              hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(oi.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(oi.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(oi.orderItemId.eq(entity.getOrderItemId())).execute();
        return (int) affected;
    }
}
