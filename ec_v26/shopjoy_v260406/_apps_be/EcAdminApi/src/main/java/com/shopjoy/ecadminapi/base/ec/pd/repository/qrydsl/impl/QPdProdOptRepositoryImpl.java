package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdOpt (pd_prod_opt — 옵션값) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdOptRepositoryImpl implements QPdProdOptRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdOptRepositoryImpl";
    private static final QPdProdOpt pdProdOpt = QPdProdOpt.pdProdOpt;

    private JPAQuery<PdProdOptDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdOptDto.Item.class,
                        pdProdOpt.prodOptId,
                        pdProdOpt.siteId,
                        pdProdOpt.prodOptTypeId,
                        pdProdOpt.prodId,
                        pdProdOpt.prodOptNm,
                        pdProdOpt.prodOptVal,
                        pdProdOpt.prodOptValCodeId,
                        pdProdOpt.parentProdOptId,
                        pdProdOpt.optStyle,
                        pdProdOpt.sortOrd,
                        pdProdOpt.useYn,
                        pdProdOpt.regBy,
                        pdProdOpt.regDate,
                        pdProdOpt.updBy,
                        pdProdOpt.updDate
                ))
                .from(pdProdOpt);
    }

    /* 상품 옵션값 키조회 */
    @Override
    public Optional<PdProdOptDto.Item> selectById(String prodOptId) {
        PdProdOptDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdOpt.prodOptId.eq(prodOptId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 옵션값 목록조회 */
    @Override
    public List<PdProdOptDto.Item> selectList(PdProdOptDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndOptTypeId(search),
                    baseAndProdIds(search),
                    baseAndProdId(search),
                    baseAndSiteId(search),
                    baseAndProdOptId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 상품 옵션값 페이지조회 */
    @Override
    public PdProdOptDto.PageResponse selectPageData(PdProdOptDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndOptTypeId(search),
                baseAndProdIds(search),
                baseAndProdId(search),
                baseAndSiteId(search),
                baseAndProdOptId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PdProdOptDto.Item> query = baseSelColumnQuery();

        List<PdProdOptDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(pageSize)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdOpt.count())
                .where(wheres)
                .fetchOne();

        PdProdOptDto.PageResponse res = new PdProdOptDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * ============================================================ */

    private BooleanExpression baseAndOptTypeId(PdProdOptDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdOptTypeId())
                ? pdProdOpt.prodOptTypeId.eq(search.getProdOptTypeId()) : null;
    }

    private BooleanExpression baseAndProdIds(PdProdOptDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getProdIds())
                ? pdProdOpt.prodId.in(search.getProdIds()) : null;
    }

    private BooleanExpression baseAndProdId(PdProdOptDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? pdProdOpt.prodId.eq(search.getProdId()) : null;
    }

    private BooleanExpression baseAndSiteId(PdProdOptDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdProdOpt.siteId.eq(search.getSiteId()) : null;
    }

    private BooleanExpression baseAndProdOptId(PdProdOptDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdOptId())
                ? pdProdOpt.prodOptId.eq(search.getProdOptId()) : null;
    }

    private BooleanExpression baseAndDateRange(PdProdOptDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdProdOpt.regDate.goe(start).and(pdProdOpt.regDate.lt(endExcl));
            case "upd_date": return pdProdOpt.updDate.goe(start).and(pdProdOpt.updDate.lt(endExcl));
            default: return null;
        }
    }

    private BooleanExpression baseAndSearchValue(PdProdOptDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",prodOptId,", pdProdOpt.prodOptId, pattern);
        or = orLike(or, all, types, ",prodOptTypeId,", pdProdOpt.prodOptTypeId, pattern);
        or = orLike(or, all, types, ",prodId,", pdProdOpt.prodId, pattern);
        or = orLike(or, all, types, ",prodOptNm,", pdProdOpt.prodOptNm, pattern);
        or = orLike(or, all, types, ",prodOptVal,", pdProdOpt.prodOptVal, pattern);
        or = orLike(or, all, types, ",prodOptValCodeId,", pdProdOpt.prodOptValCodeId, pattern);
        or = orLike(or, all, types, ",parentProdOptId,", pdProdOpt.parentProdOptId, pattern);
        or = orLike(or, all, types, ",siteId,", pdProdOpt.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", pdProdOpt.useYn, pattern);
        return or;
    }

    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdOptDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.prodOptId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodOptId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdOpt.prodOptId));
                } else if ("prodOptNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdOpt.prodOptNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdOpt.regDate));
                } else if ("sortOrd".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdOpt.sortOrd));
                }
            }
        }
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.prodOptId));
        }
        return orders;
    }

    /* 상품 옵션값 수정 */
    @Override
    public int updateSelective(PdProdOpt entity) {
        if (entity.getProdOptId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdOpt);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(pdProdOpt.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getProdOptTypeId()     != null) { update.set(pdProdOpt.prodOptTypeId,     entity.getProdOptTypeId());     hasAny = true; }
        if (entity.getProdId()            != null) { update.set(pdProdOpt.prodId,            entity.getProdId());            hasAny = true; }
        if (entity.getProdOptNm()         != null) { update.set(pdProdOpt.prodOptNm,         entity.getProdOptNm());         hasAny = true; }
        if (entity.getProdOptVal()        != null) { update.set(pdProdOpt.prodOptVal,        entity.getProdOptVal());        hasAny = true; }
        if (entity.getProdOptValCodeId()  != null) { update.set(pdProdOpt.prodOptValCodeId,  entity.getProdOptValCodeId());  hasAny = true; }
        if (entity.getParentProdOptId()   != null) { update.set(pdProdOpt.parentProdOptId,   entity.getParentProdOptId());   hasAny = true; }
        if (entity.getOptStyle()          != null) { update.set(pdProdOpt.optStyle,          entity.getOptStyle());          hasAny = true; }
        if (entity.getSortOrd()           != null) { update.set(pdProdOpt.sortOrd,           entity.getSortOrd());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(pdProdOpt.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(pdProdOpt.updBy,             entity.getUpdBy());             hasAny = true; }
        update.set(pdProdOpt.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdOpt.prodOptId.eq(entity.getProdOptId())).execute();
        return (int) affected;
    }
}
