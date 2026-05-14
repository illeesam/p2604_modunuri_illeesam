package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEventItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmEventItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventItemRepositoryImpl implements QPmEventItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmEventItem i = QPmEventItem.pmEventItem;

    @Override
    public Optional<PmEventItemDto.Item> selectById(String eventItemId) {
        PmEventItemDto.Item dto = baseQuery()
                .where(i.eventItemId.eq(eventItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmEventItemDto.Item> selectList(PmEventItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public PmEventItemDto.PageResponse selectPageList(PmEventItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmEventItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        PmEventItemDto.PageResponse res = new PmEventItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PmEventItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmEventItemDto.Item.class,
                        i.eventItemId, i.eventId, i.siteId,
                        i.targetTypeCd, i.targetId, i.sortNo,
                        i.regBy, i.regDate
                ))
                .from(i);
    }

    private BooleanBuilder buildCondition(PmEventItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getEventItemId())) w.and(i.eventItemId.eq(s.getEventItemId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDate = LocalDate.parse(s.getDateStart(), fmt);
            LocalDate endDate   = LocalDate.parse(s.getDateEnd(),   fmt);
            LocalDateTime start   = startDate.atStartOfDay();
            LocalDateTime endExcl = endDate.plusDays(1).atStartOfDay();
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
    private List<OrderSpecifier<?>> buildOrder(PmEventItemDto.Request s) {
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
                if ("eventItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.eventItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(PmEventItem entity) {
        if (entity.getEventItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getEventId()     != null) { update.set(i.eventId,     entity.getEventId());     hasAny = true; }
        if (entity.getSiteId()      != null) { update.set(i.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(i.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(i.targetId,    entity.getTargetId());    hasAny = true; }
        if (entity.getSortNo()      != null) { update.set(i.sortNo,      entity.getSortNo());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.eventItemId.eq(entity.getEventItemId())).execute();
        return (int) affected;
    }
}
