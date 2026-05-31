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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdSetItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdProdSetItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdSetItemRepositoryImpl implements QPdProdSetItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdSetItemRepositoryImpl";
    private static final QPdProdSetItem i    = QPdProdSetItem.pdProdSetItem;
    private static final QSySite        ste  = QSySite.sySite;
    private static final QPdProd        prd  = new QPdProd("prd");
    private static final QPdProd        prd2 = new QPdProd("prd2");

    /* 세트상품 구성 키조회 */
    @Override
    public Optional<PdProdSetItemDto.Item> selectById(String setItemId) {
        PdProdSetItemDto.Item dto = baseQuery()
                .where(i.setItemId.eq(setItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 세트상품 구성 목록조회 */
    @Override
    public List<PdProdSetItemDto.Item> selectList(PdProdSetItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSetItemDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndSetItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
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

    /* 세트상품 구성 페이지조회 */
    @Override
    public PdProdSetItemDto.PageResponse selectPageList(PdProdSetItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSetItemDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndSetItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdSetItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(i.count()).from(i).where(
                baseAndSiteId(search),
                baseAndSetItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        PdProdSetItemDto.PageResponse res = new PdProdSetItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 세트상품 구성 baseQuery */
    private JPAQuery<PdProdSetItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdSetItemDto.Item.class,
                        i.setItemId, i.siteId, i.setProdId, i.itemProdId, i.itemSkuId,
                        i.itemNm, i.itemQty, i.itemDesc, i.sortOrd, i.useYn,
                        i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i)
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(prd).on(prd.prodId.eq(i.setProdId))
                .leftJoin(prd2).on(prd2.prodId.eq(i.itemProdId));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdProdSetItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? i.siteId.eq(search.getSiteId()) : null;
    }

    /* setItemId 정확 일치 */
    private BooleanExpression baseAndSetItemId(PdProdSetItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSetItemId())
                ? i.setItemId.eq(search.getSetItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdProdSetItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return i.regDate.goe(start).and(i.regDate.lt(endExcl));
            case "upd_date": return i.updDate.goe(start).and(i.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdProdSetItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",itemDesc,", i.itemDesc, pattern);
        or = orLike(or, all, types, ",itemNm,", i.itemNm, pattern);
        or = orLike(or, all, types, ",itemProdId,", i.itemProdId, pattern);
        or = orLike(or, all, types, ",itemSkuId,", i.itemSkuId, pattern);
        or = orLike(or, all, types, ",setItemId,", i.setItemId, pattern);
        or = orLike(or, all, types, ",setProdId,", i.setProdId, pattern);
        or = orLike(or, all, types, ",siteId,", i.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", i.useYn, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdSetItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, i.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.setItemId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("setItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.setItemId));
                } else if ("itemNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.itemNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, i.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, i.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.setItemId));
        }
        return orders;
    }

    /* 세트상품 구성 수정 */
    @Override
    public int updateSelective(PdProdSetItem entity) {
        if (entity.getSetItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(i.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getSetProdId()  != null) { update.set(i.setProdId,  entity.getSetProdId());  hasAny = true; }
        if (entity.getItemProdId() != null) { update.set(i.itemProdId, entity.getItemProdId()); hasAny = true; }
        if (entity.getItemSkuId()  != null) { update.set(i.itemSkuId,  entity.getItemSkuId());  hasAny = true; }
        if (entity.getItemNm()     != null) { update.set(i.itemNm,     entity.getItemNm());     hasAny = true; }
        if (entity.getItemQty()    != null) { update.set(i.itemQty,    entity.getItemQty());    hasAny = true; }
        if (entity.getItemDesc()   != null) { update.set(i.itemDesc,   entity.getItemDesc());   hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(i.sortOrd,    entity.getSortOrd());    hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(i.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(i.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(i.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(i.setItemId.eq(entity.getSetItemId())).execute();
        return (int) affected;
    }
}
