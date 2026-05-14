package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmDiscntItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntItemRepositoryImpl implements QPmDiscntItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmDiscntItem i = QPmDiscntItem.pmDiscntItem;

    @Override
    public Optional<PmDiscntItemDto.Item> selectById(String discntItemId) {
        PmDiscntItemDto.Item dto = baseQuery()
                .where(i.discntItemId.eq(discntItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmDiscntItemDto.Item> selectList(PmDiscntItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntItemDto.Item> query = baseQuery().where(where);
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
    public PmDiscntItemDto.PageResponse selectPageList(PmDiscntItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmDiscntItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        PmDiscntItemDto.PageResponse res = new PmDiscntItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PmDiscntItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntItemDto.Item.class,
                        i.discntItemId, i.discntId, i.siteId,
                        i.targetTypeCd, i.targetId,
                        i.regBy, i.regDate
                ))
                .from(i);
    }

    private BooleanBuilder buildCondition(PmDiscntItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDiscntItemId())) w.and(i.discntItemId.eq(s.getDiscntItemId()));

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

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmDiscntItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.discntItemId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.discntItemId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.regDate));      break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.regDate));      break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));      break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmDiscntItem entity) {
        if (entity.getDiscntItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getDiscntId()    != null) { update.set(i.discntId,    entity.getDiscntId());    hasAny = true; }
        if (entity.getSiteId()      != null) { update.set(i.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(i.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(i.targetId,    entity.getTargetId());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.discntItemId.eq(entity.getDiscntItemId())).execute();
        return (int) affected;
    }
}
