package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdClaimItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdClaimItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdClaimItemRepositoryImpl implements QOdClaimItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdClaimItem i = QOdClaimItem.odClaimItem;

    @Override
    public Optional<OdClaimItemDto.Item> selectById(String claimItemId) {
        OdClaimItemDto.Item dto = baseListQuery()
                .where(i.claimItemId.eq(claimItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdClaimItemDto.Item> selectList(OdClaimItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimItemDto.Item> query = baseListQuery().where(where);
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
    public OdClaimItemDto.PageResponse selectPageList(OdClaimItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimItemDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdClaimItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        OdClaimItemDto.PageResponse res = new OdClaimItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<OdClaimItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdClaimItemDto.Item.class,
                        i.claimItemId, i.siteId, i.claimId, i.orderItemId,
                        i.prodId, i.prodNm, i.prodOption,
                        i.unitPrice, i.claimQty, i.itemAmt, i.refundAmt,
                        i.claimItemStatusCd, i.claimItemStatusCdBefore,
                        i.returnShippingFee, i.inboundShippingFee, i.exchangeShippingFee,
                        i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i);
    }

    private BooleanBuilder buildCondition(OdClaimItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getClaimItemId())) w.and(i.claimItemId.eq(s.getClaimItemId()));

        // searchValue + searchTypes
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_prod_nm")) or.or(i.prodNm.likeIgnoreCase(pattern));
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
                    w.and(i.regDate.goe(start)).and(i.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(i.updDate.goe(start)).and(i.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(OdClaimItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.claimItemId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.prodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(OdClaimItem entity) {
        if (entity.getClaimItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()                  != null) { update.set(i.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getClaimId()                 != null) { update.set(i.claimId,                 entity.getClaimId());                 hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(i.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getProdId()                  != null) { update.set(i.prodId,                  entity.getProdId());                  hasAny = true; }
        if (entity.getProdNm()                  != null) { update.set(i.prodNm,                  entity.getProdNm());                  hasAny = true; }
        if (entity.getProdOption()              != null) { update.set(i.prodOption,              entity.getProdOption());              hasAny = true; }
        if (entity.getUnitPrice()               != null) { update.set(i.unitPrice,               entity.getUnitPrice());               hasAny = true; }
        if (entity.getClaimQty()                != null) { update.set(i.claimQty,                entity.getClaimQty());                hasAny = true; }
        if (entity.getItemAmt()                 != null) { update.set(i.itemAmt,                 entity.getItemAmt());                 hasAny = true; }
        if (entity.getRefundAmt()               != null) { update.set(i.refundAmt,               entity.getRefundAmt());               hasAny = true; }
        if (entity.getClaimItemStatusCd()       != null) { update.set(i.claimItemStatusCd,       entity.getClaimItemStatusCd());       hasAny = true; }
        if (entity.getClaimItemStatusCdBefore() != null) { update.set(i.claimItemStatusCdBefore, entity.getClaimItemStatusCdBefore()); hasAny = true; }
        if (entity.getReturnShippingFee()       != null) { update.set(i.returnShippingFee,       entity.getReturnShippingFee());       hasAny = true; }
        if (entity.getInboundShippingFee()      != null) { update.set(i.inboundShippingFee,      entity.getInboundShippingFee());      hasAny = true; }
        if (entity.getExchangeShippingFee()     != null) { update.set(i.exchangeShippingFee,     entity.getExchangeShippingFee());     hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(i.updBy,                   entity.getUpdBy());                   hasAny = true; }
        if (entity.getUpdDate()                 != null) { update.set(i.updDate,                 entity.getUpdDate());                 hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.claimItemId.eq(entity.getClaimItemId())).execute();
        return (int) affected;
    }
}
