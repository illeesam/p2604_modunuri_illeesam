package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdChgHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdhProdChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdChgHistRepositoryImpl implements QPdhProdChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdhProdChgHist h   = QPdhProdChgHist.pdhProdChgHist;
    private static final QSySite        ste = QSySite.sySite;

    /** 기본 쿼리 빌드 */
    private JPAQuery<PdhProdChgHistDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdChgHistDto.Item.class,
                        h.prodChgHistId,
                        h.siteId,
                        h.prodId,
                        h.chgTypeCd,
                        h.beforeVal,
                        h.afterVal,
                        h.chgReason,
                        h.chgUserId,
                        h.chgDate,
                        h.regBy, h.regDate, h.updBy, h.updDate
                ))
                .from(h)
                .leftJoin(ste).on(ste.siteId.eq(h.siteId));
    }

    @Override
    public Optional<PdhProdChgHistDto.Item> selectById(String id) {
        PdhProdChgHistDto.Item dto = buildBaseQuery()
                .where(h.prodChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdhProdChgHistDto.Item> selectList(PdhProdChgHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdChgHistDto.Item> query = buildBaseQuery().where(where);
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
    public PdhProdChgHistDto.PageResponse selectPageList(PdhProdChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdChgHistDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdhProdChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(h.count())
                .from(h)
                .where(where)
                .fetchOne();

        PdhProdChgHistDto.PageResponse res = new PdhProdChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pdhProdChgHistCond 와 동일 동작 */
    private BooleanBuilder buildCondition(PdhProdChgHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))         w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getProdChgHistId())) w.and(h.prodChgHistId.eq(s.getProdChgHistId()));

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(h.regDate.goe(start)).and(h.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(h.updDate.goe(start)).and(h.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdhProdChgHistDto.Request s) {
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
                if ("prodChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.prodChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        return orders;
    }

    /** updateSelective — null 이 아닌 필드만 UPDATE */
    @Override
    public int updateSelective(PdhProdChgHist entity) {
        if (entity.getProdChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(h.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getProdId()      != null) { update.set(h.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(h.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(h.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(h.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(h.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(h.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(h.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(h.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(h.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.prodChgHistId.eq(entity.getProdChgHistId())).execute();
        return (int) affected;
    }
}
