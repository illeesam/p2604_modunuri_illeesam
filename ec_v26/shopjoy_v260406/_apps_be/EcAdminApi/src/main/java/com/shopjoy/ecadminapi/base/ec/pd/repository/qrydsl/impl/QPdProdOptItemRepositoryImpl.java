package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdProdOptItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdOptItemRepositoryImpl implements QPdProdOptItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdOptItemRepositoryImpl";
    private static final QPdProdOptItem a = QPdProdOptItem.pdProdOptItem;
    private static final QPdProdOpt     opt = QPdProdOpt.pdProdOpt;

    private JPAQuery<PdProdOptItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdOptItemDto.Item.class,
                        a.optItemId,
                        a.siteId,
                        a.optId,
                        a.optTypeCd,
                        a.optNm,
                        a.optVal,
                        a.optValCodeId,
                        a.parentOptItemId,
                        a.optStyle,
                        a.sortOrd,
                        a.useYn,
                        a.regBy,
                        a.regDate,
                        a.updBy,
                        a.updDate
                ))
                .from(a);
    }

    /* 상품 옵션 아이템 키조회 */
    @Override
    public Optional<PdProdOptItemDto.Item> selectById(String optItemId) {
        PdProdOptItemDto.Item dto = baseSelColumnQuery()
                .where(a.optItemId.eq(optItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 옵션 아이템 목록조회 */
    @Override
    public List<PdProdOptItemDto.Item> selectList(PdProdOptItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptItemDto.Item> query = baseSelColumnQuery().where(
                baseAndOptId(search),
                baseAndSiteId(search),
                baseAndOptItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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

    /* 상품 옵션 아이템 페이지조회 */
    @Override
    public PdProdOptItemDto.PageResponse selectPageList(PdProdOptItemDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptItemDto.Item> query = baseSelColumnQuery().where(
                baseAndOptId(search),
                baseAndSiteId(search),
                baseAndOptItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdOptItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndOptId(search),
                baseAndSiteId(search),
                baseAndOptItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        PdProdOptItemDto.PageResponse res = new PdProdOptItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* optId 정확 일치 */
    private BooleanExpression baseAndOptId(PdProdOptItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getOptId())
                ? a.optId.eq(search.getOptId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdProdOptItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* optItemId 정확 일치 */
    private BooleanExpression baseAndOptItemId(PdProdOptItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getOptItemId())
                ? a.optItemId.eq(search.getOptItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdProdOptItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdProdOptItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",optId,", a.optId, pattern);
        or = orLike(or, all, types, ",optItemId,", a.optItemId, pattern);
        or = orLike(or, all, types, ",optNm,", a.optNm, pattern);
        or = orLike(or, all, types, ",optStyle,", a.optStyle, pattern);
        or = orLike(or, all, types, ",optTypeCd,", a.optTypeCd, pattern);
        or = orLike(or, all, types, ",optVal,", a.optVal, pattern);
        or = orLike(or, all, types, ",optValCodeId,", a.optValCodeId, pattern);
        or = orLike(or, all, types, ",parentOptItemId,", a.parentOptItemId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", a.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdProdOptItemDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.optItemId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("optItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.optItemId));
                } else if ("optNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.optNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, a.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.optItemId));
        }
        return orders;
    }

    /* 상품 옵션 아이템 수정 */

    @Override
    public int updateSelective(PdProdOptItem entity) {
        if (entity.getOptItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(a.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getOptId()           != null) { update.set(a.optId,           entity.getOptId());           hasAny = true; }
        if (entity.getOptTypeCd()       != null) { update.set(a.optTypeCd,       entity.getOptTypeCd());       hasAny = true; }
        if (entity.getOptNm()           != null) { update.set(a.optNm,           entity.getOptNm());           hasAny = true; }
        if (entity.getOptVal()          != null) { update.set(a.optVal,          entity.getOptVal());          hasAny = true; }
        if (entity.getOptValCodeId()    != null) { update.set(a.optValCodeId,    entity.getOptValCodeId());    hasAny = true; }
        if (entity.getParentOptItemId() != null) { update.set(a.parentOptItemId, entity.getParentOptItemId()); hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(a.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(a.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(a.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.optItemId.eq(entity.getOptItemId())).execute();
        return (int) affected;
    }
}
