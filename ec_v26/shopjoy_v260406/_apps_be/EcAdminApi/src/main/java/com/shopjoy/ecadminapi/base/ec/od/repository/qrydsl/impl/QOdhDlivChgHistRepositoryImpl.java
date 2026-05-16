package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhDlivChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdhDlivChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhDlivChgHistRepositoryImpl implements QOdhDlivChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdhDlivChgHist h = QOdhDlivChgHist.odhDlivChgHist;

    /* 배송 변경 이력 baseQuery */
    private JPAQuery<OdhDlivChgHistDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivChgHistDto.Item.class,
                        h.dlivChgHistId, h.siteId, h.dlivId,
                        h.chgTypeCd, h.chgField, h.beforeVal, h.afterVal,
                        h.chgReason, h.chgUserId, h.chgDate,
                        h.regBy, h.regDate, h.updBy, h.updDate))
                .from(h);
    }

    /* 배송 변경 이력 키조회 */
    @Override
    public Optional<OdhDlivChgHistDto.Item> selectById(String id) {
        OdhDlivChgHistDto.Item dto = baseQuery()
                .where(h.dlivChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 변경 이력 목록조회 */
    @Override
    public List<OdhDlivChgHistDto.Item> selectList(OdhDlivChgHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivChgHistDto.Item> query = baseQuery().where(where);
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

    /* 배송 변경 이력 페이지조회 */
    @Override
    public OdhDlivChgHistDto.PageResponse selectPageList(OdhDlivChgHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivChgHistDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhDlivChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(h.count()).from(h).where(where).fetchOne();

        OdhDlivChgHistDto.PageResponse res = new OdhDlivChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 배송 변경 이력 buildCondition */
    private BooleanBuilder buildCondition(OdhDlivChgHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))        w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDlivChgHistId())) w.and(h.dlivChgHistId.eq(s.getDlivChgHistId()));

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
    private List<OrderSpecifier<?>> buildOrder(OdhDlivChgHistDto.Request s) {
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
                if ("dlivChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.dlivChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        return orders;
    }

    /* 배송 변경 이력 수정 */
    @Override
    public int updateSelective(OdhDlivChgHist entity) {
        if (entity.getDlivChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(h.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getDlivId()     != null) { update.set(h.dlivId,     entity.getDlivId());     hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(h.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(h.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(h.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(h.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(h.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(h.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(h.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(h.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(h.updDate,    entity.getUpdDate());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.dlivChgHistId.eq(entity.getDlivChgHistId())).execute();
        return (int) affected;
    }
}
