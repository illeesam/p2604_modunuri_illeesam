package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdhDlivStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhDlivStatusHistRepositoryImpl implements QOdhDlivStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdhDlivStatusHist h = QOdhDlivStatusHist.odhDlivStatusHist;

    private JPAQuery<OdhDlivStatusHistDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivStatusHistDto.Item.class,
                        h.dlivStatusHistId, h.siteId, h.dlivId, h.orderId,
                        h.dlivStatusCdBefore, h.dlivStatusCd, h.statusReason,
                        h.chgUserId, h.chgDate, h.memo,
                        h.regBy, h.regDate, h.updBy, h.updDate))
                .from(h);
    }

    @Override
    public Optional<OdhDlivStatusHistDto.Item> selectById(String id) {
        OdhDlivStatusHistDto.Item dto = baseQuery()
                .where(h.dlivStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdhDlivStatusHistDto.Item> selectList(OdhDlivStatusHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivStatusHistDto.Item> query = baseQuery().where(where);
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
    public OdhDlivStatusHistDto.PageResponse selectPageList(OdhDlivStatusHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivStatusHistDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhDlivStatusHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(h.count()).from(h).where(where).fetchOne();

        OdhDlivStatusHistDto.PageResponse res = new OdhDlivStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(OdhDlivStatusHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))           w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDlivStatusHistId())) w.and(h.dlivStatusHistId.eq(s.getDlivStatusHistId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            if ("reg_date".equals(s.getDateType())) {
                w.and(h.regDate.goe(start)).and(h.regDate.lt(endExcl));
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhDlivStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.dlivStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(OdhDlivStatusHist entity) {
        if (entity.getDlivStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(h.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getDlivId()             != null) { update.set(h.dlivId,             entity.getDlivId());             hasAny = true; }
        if (entity.getOrderId()            != null) { update.set(h.orderId,            entity.getOrderId());            hasAny = true; }
        if (entity.getDlivStatusCdBefore() != null) { update.set(h.dlivStatusCdBefore, entity.getDlivStatusCdBefore()); hasAny = true; }
        if (entity.getDlivStatusCd()       != null) { update.set(h.dlivStatusCd,       entity.getDlivStatusCd());       hasAny = true; }
        if (entity.getStatusReason()       != null) { update.set(h.statusReason,       entity.getStatusReason());       hasAny = true; }
        if (entity.getChgUserId()          != null) { update.set(h.chgUserId,          entity.getChgUserId());          hasAny = true; }
        if (entity.getChgDate()            != null) { update.set(h.chgDate,            entity.getChgDate());            hasAny = true; }
        if (entity.getMemo()               != null) { update.set(h.memo,               entity.getMemo());               hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(h.updBy,              entity.getUpdBy());              hasAny = true; }
        if (entity.getUpdDate()            != null) { update.set(h.updDate,            entity.getUpdDate());            hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.dlivStatusHistId.eq(entity.getDlivStatusHistId())).execute();
        return (int) affected;
    }
}
