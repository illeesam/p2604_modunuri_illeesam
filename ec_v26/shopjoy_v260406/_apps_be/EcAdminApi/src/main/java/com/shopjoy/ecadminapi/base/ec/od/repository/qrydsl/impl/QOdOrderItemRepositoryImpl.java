package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderItemRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSku;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
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
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderItemDto.Item> query = baseQuery().where(where);
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

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdOrderItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(oi.count())
                .from(oi)
                .where(where)
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

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(OdOrderItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(oi.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getOrderItemId())) w.and(oi.orderItemId.eq(s.getOrderItemId()));

        // searchValue + searchType
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_order_id,")) or.or(oi.orderId.likeIgnoreCase(pattern));
            if (all || types.contains(",def_prod_nm,"))  or.or(oi.prodNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(oi.regDate.goe(start)).and(oi.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(oi.updDate.goe(start)).and(oi.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
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
        if (entity.getUpdDate()                 != null) { update.set(oi.updDate,                 entity.getUpdDate());                 hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(oi.orderItemId.eq(entity.getOrderItemId())).execute();
        return (int) affected;
    }
}
