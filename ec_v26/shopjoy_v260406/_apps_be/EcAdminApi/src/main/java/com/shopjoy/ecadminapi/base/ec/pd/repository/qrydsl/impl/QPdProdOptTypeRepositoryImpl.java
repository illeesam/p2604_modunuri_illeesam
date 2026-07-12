package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptTypeDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptType;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOptType;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdOptType (pd_prod_opt_type — 옵션유형) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdOptTypeRepositoryImpl implements QPdProdOptTypeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdOptTypeRepositoryImpl";
    private static final QPdProdOptType pdProdOptType = QPdProdOptType.pdProdOptType;

    private JPAQuery<PdProdOptTypeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdOptTypeDto.Item.class,
                        pdProdOptType.prodOptTypeId,
                        pdProdOptType.siteId,
                        pdProdOptType.prodId,
                        pdProdOptType.prodOptTypeNm,
                        pdProdOptType.prodOptTypeLevel,
                        pdProdOptType.prodOptTypeLevel1Cd,
                        pdProdOptType.prodOptTypeLevel2Cd,
                        pdProdOptType.sortOrd,
                        pdProdOptType.regBy,
                        pdProdOptType.regDate,
                        pdProdOptType.updBy,
                        pdProdOptType.updDate
                ))
                .from(pdProdOptType);
    }

    /* 옵션유형 키조회 */
    @Override
    public Optional<PdProdOptTypeDto.Item> selectById(String prodOptTypeId) {
        PdProdOptTypeDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdProdOptType.prodOptTypeId.eq(prodOptTypeId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 옵션유형 목록조회 */
    @Override
    public List<PdProdOptTypeDto.Item> selectList(PdProdOptTypeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptTypeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndProdId(search),
                    baseAndProdIds(search),
                    baseAndSiteId(search),
                    baseAndOptTypeId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        }
        return query.fetch();
    }

    /* 옵션유형 페이지조회 */
    @Override
    public PdProdOptTypeDto.PageResponse selectPageData(PdProdOptTypeDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndProdId(search),
                baseAndProdIds(search),
                baseAndSiteId(search),
                baseAndOptTypeId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PdProdOptTypeDto.Item> query = baseSelColumnQuery();

        List<PdProdOptTypeDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(pageSize)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdOptType.count())
                .where(wheres)
                .fetchOne();

        PdProdOptTypeDto.PageResponse res = new PdProdOptTypeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * ============================================================ */

    private BooleanExpression baseAndProdId(PdProdOptTypeDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? pdProdOptType.prodId.eq(search.getProdId()) : null;
    }

    private BooleanExpression baseAndProdIds(PdProdOptTypeDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getProdIds())
                ? pdProdOptType.prodId.in(search.getProdIds()) : null;
    }

    private BooleanExpression baseAndSiteId(PdProdOptTypeDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdProdOptType.siteId.eq(search.getSiteId()) : null;
    }

    private BooleanExpression baseAndOptTypeId(PdProdOptTypeDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdOptTypeId())
                ? pdProdOptType.prodOptTypeId.eq(search.getProdOptTypeId()) : null;
    }

    private BooleanExpression baseAndDateRange(PdProdOptTypeDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdProdOptType.regDate.goe(start).and(pdProdOptType.regDate.lt(endExcl));
            case "upd_date": return pdProdOptType.updDate.goe(start).and(pdProdOptType.updDate.lt(endExcl));
            default: return null;
        }
    }

    private BooleanExpression baseAndSearchValue(PdProdOptTypeDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",prodOptTypeId,", pdProdOptType.prodOptTypeId, pattern);
        or = orLike(or, all, types, ",prodId,", pdProdOptType.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pdProdOptType.siteId, pattern);
        or = orLike(or, all, types, ",prodOptTypeNm,", pdProdOptType.prodOptTypeNm, pattern);
        return or;
    }

    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdOptTypeDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOptType.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOptType.prodOptTypeLevel));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOptType.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOptType.prodOptTypeId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String[] fieldAndDir = part.trim().split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if      ("prodOptTypeId".equals(field))    orders.add(new OrderSpecifier(order, pdProdOptType.prodOptTypeId));
                else if ("prodOptTypeNm".equals(field))    orders.add(new OrderSpecifier(order, pdProdOptType.prodOptTypeNm));
                else if ("prodOptTypeLevel".equals(field)) orders.add(new OrderSpecifier(order, pdProdOptType.prodOptTypeLevel));
                else if ("sortOrd".equals(field))          orders.add(new OrderSpecifier(order, pdProdOptType.sortOrd));
                else if ("regDate".equals(field))          orders.add(new OrderSpecifier(order, pdProdOptType.regDate));
            }
        }
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOptType.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOptType.prodOptTypeLevel));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOptType.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOptType.prodOptTypeId));
        }
        return orders;
    }

    /* 옵션유형 수정 */
    @Override
    public int updateSelective(PdProdOptType entity) {
        if (entity.getProdOptTypeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdOptType);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(pdProdOptType.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getProdId()           != null) { update.set(pdProdOptType.prodId,            entity.getProdId());            hasAny = true; }
        if (entity.getProdOptTypeNm()    != null) { update.set(pdProdOptType.prodOptTypeNm,     entity.getProdOptTypeNm());     hasAny = true; }
        if (entity.getProdOptTypeLevel()    != null) { update.set(pdProdOptType.prodOptTypeLevel,    entity.getProdOptTypeLevel());    hasAny = true; }
        if (entity.getProdOptTypeLevel1Cd() != null) { update.set(pdProdOptType.prodOptTypeLevel1Cd, entity.getProdOptTypeLevel1Cd()); hasAny = true; }
        if (entity.getProdOptTypeLevel2Cd() != null) { update.set(pdProdOptType.prodOptTypeLevel2Cd, entity.getProdOptTypeLevel2Cd()); hasAny = true; }
        if (entity.getSortOrd()             != null) { update.set(pdProdOptType.sortOrd,             entity.getSortOrd());             hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(pdProdOptType.updBy,             entity.getUpdBy());             hasAny = true; }
        update.set(pdProdOptType.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdOptType.prodOptTypeId.eq(entity.getProdOptTypeId())).execute();
        return (int) affected;
    }
}
