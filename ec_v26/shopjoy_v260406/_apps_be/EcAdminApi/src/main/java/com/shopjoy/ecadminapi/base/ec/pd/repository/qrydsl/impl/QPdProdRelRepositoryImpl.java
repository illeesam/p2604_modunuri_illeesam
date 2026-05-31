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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdRelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdProdRel QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdRelRepositoryImpl implements QPdProdRelRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdRelRepositoryImpl";
    private static final QPdProdRel r = QPdProdRel.pdProdRel;

    /** 단건 조회 */
    @Override
    public Optional<PdProdRelDto.Item> selectById(String prodRelId) {
        PdProdRelDto.Item dto = baseQuery()
                .where(r.prodRelId.eq(prodRelId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdProdRelDto.Item> selectList(PdProdRelDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdRelDto.Item> query = baseQuery().where(
                andProdRelId(search),
                andProdId(search),
                andUseYn(search),
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

    /** 페이지 목록 */
    @Override
    public PdProdRelDto.PageResponse selectPageList(PdProdRelDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdRelDto.Item> query = baseQuery().where(
                andProdRelId(search),
                andProdId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdRelDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(
                andProdRelId(search),
                andProdId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        PdProdRelDto.PageResponse res = new PdProdRelDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    private JPAQuery<PdProdRelDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdRelDto.Item.class,
                        r.prodRelId, r.prodId, r.relProdId,
                        r.prodRelTypeCd, r.sortOrd, r.useYn,
                        r.regBy, r.regDate, r.updBy, r.updDate
                ))
                .from(r);
    }

    /** 검색조건 빌드 — Mapper XML pdProdRelCond 와 동일 동작 (DTO Request 필드 한정) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* prodRelId 정확 일치 */
    private BooleanExpression andProdRelId(PdProdRelDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdRelId())
                ? r.prodRelId.eq(search.getProdRelId()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression andProdId(PdProdRelDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? r.prodId.eq(search.getProdId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(PdProdRelDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? r.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PdProdRelDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return r.regDate.goe(start).and(r.regDate.lt(endExcl));
            case "upd_date": return r.updDate.goe(start).and(r.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PdProdRelDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",prodId,", r.prodId, pattern);
        or = orLike(or, all, types, ",prodRelId,", r.prodRelId, pattern);
        or = orLike(or, all, types, ",prodRelTypeCd,", r.prodRelTypeCd, pattern);
        or = orLike(or, all, types, ",relProdId,", r.relProdId, pattern);
        or = orLike(or, all, types, ",siteId,", r.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", r.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdProdRelDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, r.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.prodRelId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodRelId".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.prodRelId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, r.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, r.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.prodRelId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdProdRel entity) {
        if (entity.getProdRelId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getProdId()        != null) { update.set(r.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getRelProdId()     != null) { update.set(r.relProdId,     entity.getRelProdId());     hasAny = true; }
        if (entity.getProdRelTypeCd() != null) { update.set(r.prodRelTypeCd, entity.getProdRelTypeCd()); hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(r.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(r.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(r.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(r.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(r.prodRelId.eq(entity.getProdRelId())).execute();
        return (int) affected;
    }
}
