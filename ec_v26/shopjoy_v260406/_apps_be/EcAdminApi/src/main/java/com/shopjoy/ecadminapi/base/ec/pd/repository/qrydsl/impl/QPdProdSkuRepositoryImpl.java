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
    private static final QPdProdSku s = QPdProdSku.pdProdSku;

    /* 상품 SKU 키조회 */
    @Override
    public Optional<PdProdSkuDto.Item> selectById(String skuId) {
        PdProdSkuDto.Item dto = baseQuery()
                .where(s.skuId.eq(skuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 SKU 목록조회 */
    @Override
    public List<PdProdSkuDto.Item> selectList(PdProdSkuDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSkuDto.Item> query = baseQuery().where(
                andProdIds(search),
                andProdId(search),
                andSiteId(search),
                andSkuId(search),
                andDateRange(search),
                andSearchValue(search)
        );
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

    /* 상품 SKU 페이지조회 */
    @Override
    public PdProdSkuDto.PageResponse selectPageList(PdProdSkuDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSkuDto.Item> query = baseQuery().where(
                andProdIds(search),
                andProdId(search),
                andSiteId(search),
                andSkuId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdSkuDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(s.count()).from(s).where(
                andProdIds(search),
                andProdId(search),
                andSiteId(search),
                andSkuId(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        PdProdSkuDto.PageResponse res = new PdProdSkuDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    private JPAQuery<PdProdSkuDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdSkuDto.Item.class,
                        s.skuId,
                        s.prodId,
                        s.optItemId1,
                        s.optItemId2,
                        s.skuCode,
                        s.addPrice,
                        s.useYn,
                        s.regBy,
                        s.regDate,
                        s.updBy,
                        s.updDate
                ))
                .from(s);
    }

    /* 상품 SKU buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* prodId IN */
    private BooleanExpression andProdIds(PdProdSkuDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getProdIds())
                ? s.prodId.in(search.getProdIds()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression andProdId(PdProdSkuDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? s.prodId.eq(search.getProdId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PdProdSkuDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? s.siteId.eq(search.getSiteId()) : null;
    }

    /* skuId 정확 일치 */
    private BooleanExpression andSkuId(PdProdSkuDto.Request search) {
        return search != null && StringUtils.hasText(search.getSkuId())
                ? s.skuId.eq(search.getSkuId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PdProdSkuDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return s.regDate.goe(start).and(s.regDate.lt(endExcl));
            case "upd_date": return s.updDate.goe(start).and(s.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PdProdSkuDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",optItemId1,", s.optItemId1, pattern);
        or = orLike(or, all, types, ",optItemId2,", s.optItemId2, pattern);
        or = orLike(or, all, types, ",prodId,", s.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", s.siteId, pattern);
        or = orLike(or, all, types, ",skuCode,", s.skuCode, pattern);
        or = orLike(or, all, types, ",skuId,", s.skuId, pattern);
        or = orLike(or, all, types, ",useYn,", s.useYn, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.skuId));
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
                    orders.add(new OrderSpecifier(order, s.skuId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.skuId));
        }
        return orders;
    }

    /* 상품 SKU 수정 */
    @Override
    public int updateSelective(PdProdSku entity) {
        if (entity.getSkuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(s.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getProdId()       != null) { update.set(s.prodId,       entity.getProdId());       hasAny = true; }
        if (entity.getOptItemId1()   != null) { update.set(s.optItemId1,   entity.getOptItemId1());   hasAny = true; }
        if (entity.getOptItemId2()   != null) { update.set(s.optItemId2,   entity.getOptItemId2());   hasAny = true; }
        if (entity.getSkuCode()      != null) { update.set(s.skuCode,      entity.getSkuCode());      hasAny = true; }
        if (entity.getAddPrice()     != null) { update.set(s.addPrice,     entity.getAddPrice());     hasAny = true; }
        if (entity.getProdOptStock() != null) { update.set(s.prodOptStock, entity.getProdOptStock()); hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(s.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(s.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(s.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(s.skuId.eq(entity.getSkuId())).execute();
        return (int) affected;
    }
}
