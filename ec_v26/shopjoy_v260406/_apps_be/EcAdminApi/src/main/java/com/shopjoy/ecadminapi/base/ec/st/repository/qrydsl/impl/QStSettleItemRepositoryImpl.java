package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** StSettleItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleItemRepositoryImpl implements QStSettleItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStSettleItem i    = QStSettleItem.stSettleItem;
    private static final QOdOrder      ord  = QOdOrder.odOrder;
    private static final QOdOrderItem  ite  = QOdOrderItem.odOrderItem;
    private static final QSySite       ste  = QSySite.sySite;
    private static final QSyCode       cdSit = new QSyCode("cd_sit");

    @Override
    public Optional<StSettleItemDto.Item> selectById(String id) {
        StSettleItemDto.Item dto = baseListQuery()
                .where(i.settleItemId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<StSettleItemDto.Item> selectList(StSettleItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleItemDto.Item> query = baseListQuery().where(where);
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

    @Override
    public StSettleItemDto.PageResponse selectPageList(StSettleItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleItemDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        StSettleItemDto.PageResponse res = new StSettleItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<StSettleItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleItemDto.Item.class,
                        i.settleItemId, i.settleId, i.siteId, i.orderId, i.orderItemId,
                        i.vendorId, i.prodId, i.settleItemTypeCd, i.orderDate, i.orderQty,
                        i.unitPrice, i.itemPrice, i.discntAmt, i.commissionRate, i.commissionAmt,
                        i.settleItemAmt, i.regBy, i.regDate,
                        ord.memberNm.as("orderNm"),
                        ite.prodNm.as("orderItemNm"),
                        ste.siteNm.as("siteNm"),
                        cdSit.codeLabel.as("settleItemTypeCdNm")
                ))
                .from(i)
                .leftJoin(ord).on(ord.orderId.eq(i.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(i.orderItemId))
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SETTLE_ITEM_TYPE").and(cdSit.codeValue.eq(i.settleItemTypeCd)));
    }

    private BooleanBuilder buildCondition(StSettleItemDto.Request c) {
        BooleanBuilder w = new BooleanBuilder();
        if (c == null) return w;

        if (StringUtils.hasText(c.getSiteId()))       w.and(i.siteId.eq(c.getSiteId()));
        if (StringUtils.hasText(c.getSettleItemId())) w.and(i.settleItemId.eq(c.getSettleItemId()));

        if (StringUtils.hasText(c.getDateType())
                && StringUtils.hasText(c.getDateStart())
                && StringUtils.hasText(c.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(c.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(c.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (c.getDateType()) {
                case "order_date":
                    w.and(i.orderDate.goe(start)).and(i.orderDate.lt(endExcl)); break;
                case "reg_date":
                    w.and(i.regDate.goe(start)).and(i.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(i.updDate.goe(start)).and(i.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleItemDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.settleItemId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.settleItemId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.orderDate));    break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.orderDate));    break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));      break;
        }
        return orders;
    }

    @Override
    public int updateSelective(StSettleItem entity) {
        if (entity.getSettleItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(i.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(i.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getOrderId()          != null) { update.set(i.orderId,          entity.getOrderId());          hasAny = true; }
        if (entity.getOrderItemId()      != null) { update.set(i.orderItemId,      entity.getOrderItemId());      hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(i.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getProdId()           != null) { update.set(i.prodId,           entity.getProdId());           hasAny = true; }
        if (entity.getSettleItemTypeCd() != null) { update.set(i.settleItemTypeCd, entity.getSettleItemTypeCd()); hasAny = true; }
        if (entity.getOrderDate()        != null) { update.set(i.orderDate,        entity.getOrderDate());        hasAny = true; }
        if (entity.getOrderQty()         != null) { update.set(i.orderQty,         entity.getOrderQty());         hasAny = true; }
        if (entity.getUnitPrice()        != null) { update.set(i.unitPrice,        entity.getUnitPrice());        hasAny = true; }
        if (entity.getItemPrice()        != null) { update.set(i.itemPrice,        entity.getItemPrice());        hasAny = true; }
        if (entity.getDiscntAmt()        != null) { update.set(i.discntAmt,        entity.getDiscntAmt());        hasAny = true; }
        if (entity.getCommissionRate()   != null) { update.set(i.commissionRate,   entity.getCommissionRate());   hasAny = true; }
        if (entity.getCommissionAmt()    != null) { update.set(i.commissionAmt,    entity.getCommissionAmt());    hasAny = true; }
        if (entity.getSettleItemAmt()    != null) { update.set(i.settleItemAmt,    entity.getSettleItemAmt());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.settleItemId.eq(entity.getSettleItemId())).execute();
        return (int) affected;
    }
}
