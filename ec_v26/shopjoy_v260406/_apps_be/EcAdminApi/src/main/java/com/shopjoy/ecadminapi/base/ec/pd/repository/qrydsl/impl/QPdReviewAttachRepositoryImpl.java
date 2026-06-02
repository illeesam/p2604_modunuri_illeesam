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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReview;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewAttachRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdReviewAttach QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewAttachRepositoryImpl implements QPdReviewAttachRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdReviewAttachRepositoryImpl";
    private static final QPdReviewAttach pdReviewAttach = QPdReviewAttach.pdReviewAttach;
    private static final QPdReview       pdReview = QPdReview.pdReview;

    /** 단건 조회 */
    @Override
    public Optional<PdReviewAttachDto.Item> selectById(String reviewAttachId) {
        PdReviewAttachDto.Item dto = baseQuerySingle()
                .where(pdReviewAttach.reviewAttachId.eq(reviewAttachId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdReviewAttachDto.Item> selectList(PdReviewAttachDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search, true);

        JPAQuery<PdReviewAttachDto.Item> query = baseQueryWithJoin().where(
                baseAndReviewIds(search),
                baseAndReviewId(search),
                baseAndSiteId(search),
                baseAndReviewAttachId(search),
                baseAndProdId(search),
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

    /** 페이지 목록 */
    @Override
    public PdReviewAttachDto.PageResponse selectPageData(PdReviewAttachDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search, false);

        JPAQuery<PdReviewAttachDto.Item> query = baseQueryWithJoin().where(
                baseAndReviewIds(search),
                baseAndReviewId(search),
                baseAndSiteId(search),
                baseAndReviewAttachId(search),
                baseAndProdId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdReviewAttachDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(pdReviewAttach.count())
                .from(pdReviewAttach)
                .leftJoin(pdReview).on(pdReview.reviewId.eq(pdReviewAttach.reviewId))
                .where(
                baseAndReviewIds(search),
                baseAndReviewId(search),
                baseAndSiteId(search),
                baseAndReviewAttachId(search),
                baseAndProdId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PdReviewAttachDto.PageResponse res = new PdReviewAttachDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** selectById 용 base query — pd_review JOIN 없음 */
    private JPAQuery<PdReviewAttachDto.Item> baseQuerySingle() {
        return queryFactory
                .select(Projections.bean(PdReviewAttachDto.Item.class,
                        pdReviewAttach.reviewAttachId, pdReviewAttach.siteId, pdReviewAttach.reviewId, pdReviewAttach.attachId,
                        pdReviewAttach.mediaTypeCd, pdReviewAttach.thumbUrl, pdReviewAttach.sortOrd,
                        pdReviewAttach.regBy, pdReviewAttach.regDate, pdReviewAttach.updBy, pdReviewAttach.updDate
                ))
                .from(pdReviewAttach);
    }

    /** 목록/페이지 용 base query — pd_review LEFT JOIN 포함 (prodId 조건 지원) */
    private JPAQuery<PdReviewAttachDto.Item> baseQueryWithJoin() {
        return queryFactory
                .select(Projections.bean(PdReviewAttachDto.Item.class,
                        pdReviewAttach.reviewAttachId, pdReviewAttach.siteId, pdReviewAttach.reviewId, pdReviewAttach.attachId,
                        pdReviewAttach.mediaTypeCd, pdReviewAttach.thumbUrl, pdReviewAttach.sortOrd,
                        pdReviewAttach.regBy, pdReviewAttach.regDate, pdReviewAttach.updBy, pdReviewAttach.updDate
                ))
                .from(pdReviewAttach)
                .leftJoin(pdReview).on(pdReview.reviewId.eq(pdReviewAttach.reviewId));
    }

    /** 검색조건 빌드 — Mapper XML pdReviewAttachCond 와 동일 동작 */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* reviewId IN */
    private BooleanExpression baseAndReviewIds(PdReviewAttachDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getReviewIds())
                ? pdReviewAttach.reviewId.in(search.getReviewIds()) : null;
    }

    /* reviewId 정확 일치 */
    private BooleanExpression baseAndReviewId(PdReviewAttachDto.Request search) {
        return search != null && StringUtils.hasText(search.getReviewId())
                ? pdReviewAttach.reviewId.eq(search.getReviewId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdReviewAttachDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdReviewAttach.siteId.eq(search.getSiteId()) : null;
    }

    /* reviewAttachId 정확 일치 */
    private BooleanExpression baseAndReviewAttachId(PdReviewAttachDto.Request search) {
        return search != null && StringUtils.hasText(search.getReviewAttachId())
                ? pdReviewAttach.reviewAttachId.eq(search.getReviewAttachId()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression baseAndProdId(PdReviewAttachDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? pdReview.prodId.eq(search.getProdId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdReviewAttachDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdReviewAttach.regDate.goe(start).and(pdReviewAttach.regDate.lt(endExcl));
            case "upd_date": return pdReviewAttach.updDate.goe(start).and(pdReviewAttach.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdReviewAttachDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attachId,", pdReviewAttach.attachId, pattern);
        or = orLike(or, all, types, ",mediaTypeCd,", pdReviewAttach.mediaTypeCd, pattern);
        or = orLike(or, all, types, ",reviewAttachId,", pdReviewAttach.reviewAttachId, pattern);
        or = orLike(or, all, types, ",reviewId,", pdReviewAttach.reviewId, pattern);
        or = orLike(or, all, types, ",siteId,", pdReviewAttach.siteId, pattern);
        or = orLike(or, all, types, ",thumbUrl,", pdReviewAttach.thumbUrl, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdReviewAttachDto.Request s, boolean withSortOrd) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            if (withSortOrd) {
                orders.add(new OrderSpecifier(Order.ASC, pdReviewAttach.sortOrd));
                orders.add(new OrderSpecifier(Order.DESC, pdReviewAttach.regDate));
            } else {
                orders.add(new OrderSpecifier(Order.DESC, pdReviewAttach.regDate));
            }
            /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
            /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
            if (orders.isEmpty()) {
                orders.add(new OrderSpecifier<>(Order.DESC, pdReviewAttach.regDate));
                orders.add(new OrderSpecifier<>(Order.ASC, pdReviewAttach.reviewAttachId));
            }
                orders.add(new OrderSpecifier<>(Order.ASC, pdReviewAttach.reviewAttachId));
            return orders;
        }
        if ("id_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  pdReviewAttach.reviewAttachId));
        } else if ("id_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdReviewAttach.reviewAttachId));
        } else if ("reg_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  pdReviewAttach.regDate));
        } else if ("reg_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdReviewAttach.regDate));
        } else {
            if (withSortOrd) {
                orders.add(new OrderSpecifier(Order.ASC, pdReviewAttach.sortOrd));
                orders.add(new OrderSpecifier(Order.DESC, pdReviewAttach.regDate));
            } else {
                orders.add(new OrderSpecifier(Order.DESC, pdReviewAttach.regDate));
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        if (orders.isEmpty()) orders.add(new OrderSpecifier<>(Order.DESC, pdReviewAttach.regDate));
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdReviewAttach entity) {
        if (entity.getReviewAttachId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdReviewAttach);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(pdReviewAttach.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getReviewId()    != null) { update.set(pdReviewAttach.reviewId,    entity.getReviewId());    hasAny = true; }
        if (entity.getAttachId()    != null) { update.set(pdReviewAttach.attachId,    entity.getAttachId());    hasAny = true; }
        if (entity.getMediaTypeCd() != null) { update.set(pdReviewAttach.mediaTypeCd, entity.getMediaTypeCd()); hasAny = true; }
        if (entity.getThumbUrl()    != null) { update.set(pdReviewAttach.thumbUrl,    entity.getThumbUrl());    hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(pdReviewAttach.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(pdReviewAttach.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdReviewAttach.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdReviewAttach.reviewAttachId.eq(entity.getReviewAttachId())).execute();
        return (int) affected;
    }
}
