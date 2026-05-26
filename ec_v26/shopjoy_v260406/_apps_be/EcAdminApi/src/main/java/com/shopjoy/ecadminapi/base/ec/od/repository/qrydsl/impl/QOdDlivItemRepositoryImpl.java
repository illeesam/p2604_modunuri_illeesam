package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdDlivItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdDlivItemRepositoryImpl implements QOdDlivItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdDlivItem i = QOdDlivItem.odDlivItem;

    /* 배송 아이템 키조회 */
    @Override
    public Optional<OdDlivItemDto.Item> selectById(String dlivItemId) {
        OdDlivItemDto.Item dto = baseQuery()
                .where(i.dlivItemId.eq(dlivItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 아이템 목록조회 */
    @Override
    public List<OdDlivItemDto.Item> selectList(OdDlivItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivItemDto.Item> query = baseQuery().where(where);
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

    /* 배송 아이템 페이지조회 */
    @Override
    public OdDlivItemDto.PageResponse selectPageList(OdDlivItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdDlivItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        OdDlivItemDto.PageResponse res = new OdDlivItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 배송 아이템 baseQuery */
    private JPAQuery<OdDlivItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdDlivItemDto.Item.class,
                        i.dlivItemId, i.siteId, i.dlivId, i.orderItemId,
                        i.prodId, i.optItemId1, i.optItemId2,
                        i.dlivTypeCd, i.unitPrice, i.dlivQty,
                        i.dlivItemStatusCd, i.dlivItemStatusCdBefore,
                        i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i);
    }

    /* 배송 아이템 buildCondition */
    private BooleanBuilder buildCondition(OdDlivItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (!CollectionUtils.isEmpty(s.getDlivIds())) w.and(i.dlivId.in(s.getDlivIds()));
        if (StringUtils.hasText(s.getDlivId()))       w.and(i.dlivId.eq(s.getDlivId()));

        if (StringUtils.hasText(s.getSiteId()))     w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDlivItemId())) w.and(i.dlivItemId.eq(s.getDlivItemId()));

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
        /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
        if (s != null && StringUtils.hasText(s.getSearchValue())) {
            String pattern = "%" + s.getSearchValue() + "%";
            String __typeRaw = s.getSearchType();
            boolean __all = !StringUtils.hasText(__typeRaw);
            String __types = __all ? "" : ("," + __typeRaw.trim() + ",");
            BooleanBuilder or = new BooleanBuilder();
            if (__all || __types.contains(",dlivId,")) or.or(i.dlivId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",dlivItemId,")) or.or(i.dlivItemId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",dlivItemStatusCd,")) or.or(i.dlivItemStatusCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",dlivItemStatusCdBefore,")) or.or(i.dlivItemStatusCdBefore.likeIgnoreCase(pattern));
            if (__all || __types.contains(",dlivTypeCd,")) or.or(i.dlivTypeCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",optItemId1,")) or.or(i.optItemId1.likeIgnoreCase(pattern));
            if (__all || __types.contains(",optItemId2,")) or.or(i.optItemId2.likeIgnoreCase(pattern));
            if (__all || __types.contains(",orderItemId,")) or.or(i.orderItemId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",prodId,")) or.or(i.prodId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",siteId,")) or.or(i.siteId.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdDlivItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.dlivItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.dlivItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.dlivItemId));
        }
        return orders;
    }

    /* 배송 아이템 수정 */
    @Override
    public int updateSelective(OdDlivItem entity) {
        if (entity.getDlivItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()                 != null) { update.set(i.siteId,                 entity.getSiteId());                 hasAny = true; }
        if (entity.getDlivId()                 != null) { update.set(i.dlivId,                 entity.getDlivId());                 hasAny = true; }
        if (entity.getOrderItemId()            != null) { update.set(i.orderItemId,            entity.getOrderItemId());            hasAny = true; }
        if (entity.getProdId()                 != null) { update.set(i.prodId,                 entity.getProdId());                 hasAny = true; }
        if (entity.getOptItemId1()             != null) { update.set(i.optItemId1,             entity.getOptItemId1());             hasAny = true; }
        if (entity.getOptItemId2()             != null) { update.set(i.optItemId2,             entity.getOptItemId2());             hasAny = true; }
        if (entity.getDlivTypeCd()             != null) { update.set(i.dlivTypeCd,             entity.getDlivTypeCd());             hasAny = true; }
        if (entity.getUnitPrice()              != null) { update.set(i.unitPrice,              entity.getUnitPrice());              hasAny = true; }
        if (entity.getDlivQty()                != null) { update.set(i.dlivQty,                entity.getDlivQty());                hasAny = true; }
        if (entity.getDlivItemStatusCd()       != null) { update.set(i.dlivItemStatusCd,       entity.getDlivItemStatusCd());       hasAny = true; }
        if (entity.getDlivItemStatusCdBefore() != null) { update.set(i.dlivItemStatusCdBefore, entity.getDlivItemStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(i.updBy,                  entity.getUpdBy());                  hasAny = true; }
        if (entity.getUpdDate()                != null) { update.set(i.updDate,                entity.getUpdDate());                hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.dlivItemId.eq(entity.getDlivItemId())).execute();
        return (int) affected;
    }
}
