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
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdOrderItemRepositoryImpl";
    private static final QOdOrderItem   odOrderItem   = QOdOrderItem.odOrderItem;
    private static final QPdProd        pdProd    = QPdProd.pdProd;
    private static final QPdProdSku     pdProdSku   = QPdProdSku.pdProdSku;
    private static final QPdProdOptItem oi1  = new QPdProdOptItem("oi1");
    private static final QPdProdOptItem oi2  = new QPdProdOptItem("oi2");
    private static final QSyCode        cdIs = new QSyCode("cd_is");
    private static final QSyCode        cdDc = new QSyCode("cd_dc");

    /* 주문 아이템(상품) baseSelColumnQuery */
    private JPAQuery<OdOrderItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderItemDto.Item.class,
                        odOrderItem.orderItemId, odOrderItem.siteId, odOrderItem.orderId, odOrderItem.prodId, odOrderItem.skuId,
                        odOrderItem.optItemId1, odOrderItem.optItemId2, odOrderItem.prodNm, odOrderItem.brandNm, odOrderItem.dlivTmpltId,
                        odOrderItem.normalPrice, odOrderItem.unitPrice, odOrderItem.orderQty, odOrderItem.itemOrderAmt,
                        odOrderItem.cancelQty, odOrderItem.itemCancelAmt, odOrderItem.completQty, odOrderItem.itemCompletedAmt,
                        odOrderItem.orgUnitPrice, odOrderItem.orgItemOrderAmt, odOrderItem.orgDiscountAmt, odOrderItem.orgShippingFee,
                        odOrderItem.saveRate, odOrderItem.saveUseAmt, odOrderItem.saveSchdAmt,
                        odOrderItem.orderItemStatusCd, odOrderItem.orderItemStatusCdBefore,
                        odOrderItem.claimYn, odOrderItem.buyConfirmYn, odOrderItem.buyConfirmSchdDate, odOrderItem.buyConfirmDate,
                        odOrderItem.settleYn, odOrderItem.settleDate,
                        odOrderItem.reserveSaleYn, odOrderItem.reserveDlivSchdDate,
                        odOrderItem.bundleGroupId, odOrderItem.bundlePriceRate, odOrderItem.giftId,
                        odOrderItem.outboundShippingFee, odOrderItem.dlivCourierCd, odOrderItem.dlivTrackingNo, odOrderItem.dlivShipDate,
                        odOrderItem.regBy, odOrderItem.regDate, odOrderItem.updBy, odOrderItem.updDate,
                        pdProd.thumbnailUrl.as("thumbnailUrl"),
                        pdProd.salePrice.as("salePriceCurrent"),
                        pdProd.prodNm.as("prodNmCurrent"),
                        pdProdSku.skuCode.as("skuCode"),
                        oi1.optNm.as("optItemNm1"),
                        oi2.optNm.as("optItemNm2"),
                        cdIs.codeLabel.as("orderItemStatusCdNm"),
                        cdDc.codeLabel.as("dlivCourierCdNm")
                ))
                .from(odOrderItem)
                .leftJoin(pdProd).on(pdProd.prodId.eq(odOrderItem.prodId))
                .leftJoin(pdProdSku).on(pdProdSku.skuId.eq(odOrderItem.skuId))
                .leftJoin(oi1).on(oi1.optItemId.eq(odOrderItem.optItemId1))
                .leftJoin(oi2).on(oi2.optItemId.eq(odOrderItem.optItemId2))
                .leftJoin(cdIs).on(cdIs.codeGrp.eq("ORDER_ITEM_STATUS").and(cdIs.codeValue.eq(odOrderItem.orderItemStatusCd)))
                .leftJoin(cdDc).on(cdDc.codeGrp.eq("COURIER").and(cdDc.codeValue.eq(odOrderItem.dlivCourierCd)));
    }

    /* 주문 아이템(상품) 키조회 */
    @Override
    public Optional<OdOrderItemDto.Item> selectById(String orderItemId) {
        OdOrderItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odOrderItem.orderItemId.eq(orderItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 아이템(상품) 목록조회 */
    @Override
    public List<OdOrderItemDto.Item> selectList(OdOrderItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndOrderIds(search),
                    baseAndOrderId(search),
                    baseAndSiteId(search),
                    baseAndOrderItemId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 주문 아이템(상품) 페이지조회 */
    @Override
    public OdOrderItemDto.PageResponse selectPageData(OdOrderItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndOrderItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdOrderItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdOrderItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odOrderItem.count())
                .where(wheres)
                .fetchOne();

        OdOrderItemDto.PageResponse res = new OdOrderItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* orderId IN */
    private BooleanExpression baseAndOrderIds(OdOrderItemDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getOrderIds())
                ? odOrderItem.orderId.in(search.getOrderIds()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression baseAndOrderId(OdOrderItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? odOrderItem.orderId.eq(search.getOrderId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdOrderItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odOrderItem.siteId.eq(search.getSiteId()) : null;
    }

    /* orderItemId 정확 일치 */
    private BooleanExpression baseAndOrderItemId(OdOrderItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderItemId())
                ? odOrderItem.orderItemId.eq(search.getOrderItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdOrderItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return odOrderItem.regDate.goe(start).and(odOrderItem.regDate.lt(endExcl));
            case "upd_date": return odOrderItem.updDate.goe(start).and(odOrderItem.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdOrderItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",brandNm,", odOrderItem.brandNm, pattern);
        or = orLike(or, all, types, ",bundleGroupId,", odOrderItem.bundleGroupId, pattern);
        or = orLike(or, all, types, ",buyConfirmYn,", odOrderItem.buyConfirmYn, pattern);
        or = orLike(or, all, types, ",claimYn,", odOrderItem.claimYn, pattern);
        or = orLike(or, all, types, ",dlivCourierCd,", odOrderItem.dlivCourierCd, pattern);
        or = orLike(or, all, types, ",dlivTmpltId,", odOrderItem.dlivTmpltId, pattern);
        or = orLike(or, all, types, ",dlivTrackingNo,", odOrderItem.dlivTrackingNo, pattern);
        or = orLike(or, all, types, ",giftId,", odOrderItem.giftId, pattern);
        or = orLike(or, all, types, ",optItemId1,", odOrderItem.optItemId1, pattern);
        or = orLike(or, all, types, ",optItemId2,", odOrderItem.optItemId2, pattern);
        or = orLike(or, all, types, ",orderId,", odOrderItem.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", odOrderItem.orderItemId, pattern);
        or = orLike(or, all, types, ",orderItemStatusCd,", odOrderItem.orderItemStatusCd, pattern);
        or = orLike(or, all, types, ",orderItemStatusCdBefore,", odOrderItem.orderItemStatusCdBefore, pattern);
        or = orLike(or, all, types, ",prodId,", odOrderItem.prodId, pattern);
        or = orLike(or, all, types, ",prodNm,", odOrderItem.prodNm, pattern);
        or = orLike(or, all, types, ",reserveSaleYn,", odOrderItem.reserveSaleYn, pattern);
        or = orLike(or, all, types, ",settleYn,", odOrderItem.settleYn, pattern);
        or = orLike(or, all, types, ",siteId,", odOrderItem.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", odOrderItem.skuId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, odOrderItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrderItem.orderItemId));
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
                    orders.add(new OrderSpecifier(order, odOrderItem.orderItemId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, odOrderItem.prodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odOrderItem.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odOrderItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrderItem.orderItemId));
        }
        return orders;
    }

    /* 주문 아이템(상품) 수정 */


    @Override
    public int updateSelective(OdOrderItem entity) {
        if (entity.getOrderItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odOrderItem);
        boolean hasAny = false;

        if (entity.getOrderItemStatusCd()       != null) { update.set(odOrderItem.orderItemStatusCd,       entity.getOrderItemStatusCd());       hasAny = true; }
        if (entity.getOrderItemStatusCdBefore() != null) { update.set(odOrderItem.orderItemStatusCdBefore, entity.getOrderItemStatusCdBefore()); hasAny = true; }
        if (entity.getBuyConfirmYn()            != null) { update.set(odOrderItem.buyConfirmYn,            entity.getBuyConfirmYn());            hasAny = true; }
        if (entity.getBuyConfirmDate()          != null) { update.set(odOrderItem.buyConfirmDate,          entity.getBuyConfirmDate());          hasAny = true; }
        if (entity.getSettleYn()                != null) { update.set(odOrderItem.settleYn,                entity.getSettleYn());                hasAny = true; }
        if (entity.getSettleDate()              != null) { update.set(odOrderItem.settleDate,              entity.getSettleDate());              hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(odOrderItem.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odOrderItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odOrderItem.orderItemId.eq(entity.getOrderItemId())).execute();
        return (int) affected;
    }
}
