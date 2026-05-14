package com.shopjoy.ecadminapi.base.ec.pd.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.QPdhProdSkuPriceHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdhProdSkuPriceHist QueryDSL Custom 구현체 — write-once 로그성 (updBy/updDate 없음) */
@RequiredArgsConstructor
public class QPdhProdSkuPriceHistRepositoryImpl implements QPdhProdSkuPriceHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdhProdSkuPriceHist h   = QPdhProdSkuPriceHist.pdhProdSkuPriceHist;
    private static final QSySite              ste = QSySite.sySite;
    private static final QPdProd              prd = QPdProd.pdProd;

    private JPAQuery<PdhProdSkuPriceHistDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdSkuPriceHistDto.Item.class,
                        h.histId,
                        h.siteId,
                        h.skuId,
                        h.prodId,
                        h.addPriceBefore,
                        h.addPriceAfter,
                        h.chgReason,
                        h.chgBy,
                        h.chgDate,
                        h.regBy,
                        h.regDate
                ))
                .from(h)
                .leftJoin(ste).on(ste.siteId.eq(h.siteId))
                .leftJoin(prd).on(prd.prodId.eq(h.prodId));
    }

    @Override
    public Optional<PdhProdSkuPriceHistDto.Item> selectById(String id) {
        PdhProdSkuPriceHistDto.Item dto = buildBaseQuery()
                .where(h.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdhProdSkuPriceHistDto.Item> selectList(PdhProdSkuPriceHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdSkuPriceHistDto.Item> query = buildBaseQuery().where(where);
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
    public PdhProdSkuPriceHistDto.PageResponse selectPageList(PdhProdSkuPriceHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdSkuPriceHistDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdhProdSkuPriceHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(h.count())
                .from(h)
                .where(where)
                .fetchOne();

        PdhProdSkuPriceHistDto.PageResponse res = new PdhProdSkuPriceHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PdhProdSkuPriceHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getHistId())) w.and(h.histId.eq(s.getHistId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            // upd_date 미존재 (write-once) → reg_date 만 처리
            if ("reg_date".equals(s.getDateType())) {
                w.and(h.regDate.goe(start)).and(h.regDate.lt(endExcl));
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdhProdSkuPriceHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  h.histId));  break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, h.histId));  break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  h.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, h.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, h.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PdhProdSkuPriceHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(h.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getSkuId()          != null) { update.set(h.skuId,          entity.getSkuId());          hasAny = true; }
        if (entity.getProdId()         != null) { update.set(h.prodId,         entity.getProdId());         hasAny = true; }
        if (entity.getAddPriceBefore() != null) { update.set(h.addPriceBefore, entity.getAddPriceBefore()); hasAny = true; }
        if (entity.getAddPriceAfter()  != null) { update.set(h.addPriceAfter,  entity.getAddPriceAfter());  hasAny = true; }
        if (entity.getChgReason()      != null) { update.set(h.chgReason,      entity.getChgReason());      hasAny = true; }
        if (entity.getChgBy()          != null) { update.set(h.chgBy,          entity.getChgBy());          hasAny = true; }
        if (entity.getChgDate()        != null) { update.set(h.chgDate,        entity.getChgDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
