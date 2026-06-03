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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdSkuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdProdSku QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdSkuRepositoryImpl implements QPdProdSkuRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdSkuRepositoryImpl";
    private static final QPdProdSku pdProdSku = QPdProdSku.pdProdSku;

    private JPAQuery<PdProdSkuDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdSkuDto.Item.class,
                        pdProdSku.skuId,
                        pdProdSku.prodId,
                        pdProdSku.optItemId1,
                        pdProdSku.optItemId2,
                        pdProdSku.skuCode,
                        pdProdSku.addPrice,
                        pdProdSku.useYn,
                        pdProdSku.regBy,
                        pdProdSku.regDate,
                        pdProdSku.updBy,
                        pdProdSku.updDate
                ))
                .from(pdProdSku);
    }

    /* 상품 SKU 키조회 */
    @Override
    public Optional<PdProdSkuDto.Item> selectById(String skuId) {
        PdProdSkuDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdSku.skuId.eq(skuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 SKU 목록조회 */
    @Override
    public List<PdProdSkuDto.Item> selectList(PdProdSkuDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSkuDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndProdIds(search),
                    baseAndProdId(search),
                    baseAndSiteId(search),
                    baseAndSkuId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 상품 SKU 페이지조회 */
    @Override
    public PdProdSkuDto.PageResponse selectPageData(PdProdSkuDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndProdIds(search),
                baseAndProdId(search),
                baseAndSiteId(search),
                baseAndSkuId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdSkuDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdSkuDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdSku.count())
                .where(wheres)
                .fetchOne();

        PdProdSkuDto.PageResponse res = new PdProdSkuDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    /* 상품 SKU buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(a), andDeptId(a), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* prodId IN */
    private BooleanExpression baseAndProdIds(PdProdSkuDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getProdIds())
                ? pdProdSku.prodId.in(search.getProdIds()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression baseAndProdId(PdProdSkuDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? pdProdSku.prodId.eq(search.getProdId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdProdSkuDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdProdSku.siteId.eq(search.getSiteId()) : null;
    }

    /* skuId 정확 일치 */
    private BooleanExpression baseAndSkuId(PdProdSkuDto.Request search) {
        return search != null && StringUtils.hasText(search.getSkuId())
                ? pdProdSku.skuId.eq(search.getSkuId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdProdSkuDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdProdSku.regDate.goe(start).and(pdProdSku.regDate.lt(endExcl));
            case "upd_date": return pdProdSku.updDate.goe(start).and(pdProdSku.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdProdSkuDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",optItemId1,", pdProdSku.optItemId1, pattern);
        or = orLike(or, all, types, ",optItemId2,", pdProdSku.optItemId2, pattern);
        or = orLike(or, all, types, ",prodId,", pdProdSku.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pdProdSku.siteId, pattern);
        or = orLike(or, all, types, ",skuCode,", pdProdSku.skuCode, pattern);
        or = orLike(or, all, types, ",skuId,", pdProdSku.skuId, pattern);
        or = orLike(or, all, types, ",useYn,", pdProdSku.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdProdSkuDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdProdSku.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSku.skuId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("skuId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdSku.skuId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdSku.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdProdSku.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSku.skuId));
        }
        return orders;
    }

    /* 상품 SKU 수정 */

    @Override
    public int updateSelective(PdProdSku entity) {
        if (entity.getSkuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdSku);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(pdProdSku.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getProdId()       != null) { update.set(pdProdSku.prodId,       entity.getProdId());       hasAny = true; }
        if (entity.getOptItemId1()   != null) { update.set(pdProdSku.optItemId1,   entity.getOptItemId1());   hasAny = true; }
        if (entity.getOptItemId2()   != null) { update.set(pdProdSku.optItemId2,   entity.getOptItemId2());   hasAny = true; }
        if (entity.getSkuCode()      != null) { update.set(pdProdSku.skuCode,      entity.getSkuCode());      hasAny = true; }
        if (entity.getAddPrice()     != null) { update.set(pdProdSku.addPrice,     entity.getAddPrice());     hasAny = true; }
        if (entity.getProdOptStock() != null) { update.set(pdProdSku.prodOptStock, entity.getProdOptStock()); hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(pdProdSku.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(pdProdSku.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdSku.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdSku.skuId.eq(entity.getSkuId())).execute();
        return (int) affected;
    }
}
