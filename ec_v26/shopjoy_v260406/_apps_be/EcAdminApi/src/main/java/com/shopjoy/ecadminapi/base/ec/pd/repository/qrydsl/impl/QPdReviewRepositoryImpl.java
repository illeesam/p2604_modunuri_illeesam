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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReview;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdReview QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewRepositoryImpl implements QPdReviewRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdReviewRepositoryImpl";
    private static final QPdReview r = QPdReview.pdReview;

    /** 단건 조회 */
    @Override
    public Optional<PdReviewDto.Item> selectById(String reviewId) {
        PdReviewDto.Item dto = baseQuery()
                .where(r.reviewId.eq(reviewId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PdReviewDto.Item> selectList(PdReviewDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdReviewDto.Item> query = baseQuery().where(
                andSiteId(search),
                andReviewId(search),
                andProdId(search),
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
    public PdReviewDto.PageResponse selectPageList(PdReviewDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdReviewDto.Item> query = baseQuery().where(
                andSiteId(search),
                andReviewId(search),
                andProdId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdReviewDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(
                andSiteId(search),
                andReviewId(search),
                andProdId(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        PdReviewDto.PageResponse res = new PdReviewDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query (DTO Item 필드만 매핑) */
    private JPAQuery<PdReviewDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdReviewDto.Item.class,
                        r.reviewId, r.siteId, r.prodId, r.memberId,
                        r.reviewTitle, r.reviewContent, r.rating,
                        r.helpfulCnt, r.unhelpfulCnt,
                        r.reviewStatusCd, r.reviewStatusCdBefore,
                        r.reviewDate,
                        r.regBy, r.regDate, r.updBy, r.updDate
                ))
                .from(r);
    }

    /** 검색조건 빌드 — Mapper XML pdReviewCond 와 동일 동작 */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PdReviewDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? r.siteId.eq(search.getSiteId()) : null;
    }

    /* reviewId 정확 일치 */
    private BooleanExpression andReviewId(PdReviewDto.Request search) {
        return search != null && StringUtils.hasText(search.getReviewId())
                ? r.reviewId.eq(search.getReviewId()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression andProdId(PdReviewDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? r.prodId.eq(search.getProdId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PdReviewDto.Request search) {
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
    private BooleanExpression andSearchValue(PdReviewDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",memberId,", r.memberId, pattern);
        or = orLike(or, all, types, ",prodId,", r.prodId, pattern);
        or = orLike(or, all, types, ",reviewContent,", r.reviewContent, pattern);
        or = orLike(or, all, types, ",reviewId,", r.reviewId, pattern);
        or = orLike(or, all, types, ",reviewStatusCd,", r.reviewStatusCd, pattern);
        or = orLike(or, all, types, ",reviewStatusCdBefore,", r.reviewStatusCdBefore, pattern);
        or = orLike(or, all, types, ",reviewTitle,", r.reviewTitle, pattern);
        or = orLike(or, all, types, ",siteId,", r.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdReviewDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.reviewId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("reviewId".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.reviewId));
                } else if ("reviewTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.reviewTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.reviewId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdReview entity) {
        if (entity.getReviewId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(r.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getProdId()               != null) { update.set(r.prodId,               entity.getProdId());               hasAny = true; }
        if (entity.getMemberId()             != null) { update.set(r.memberId,             entity.getMemberId());             hasAny = true; }
        if (entity.getReviewTitle()          != null) { update.set(r.reviewTitle,          entity.getReviewTitle());          hasAny = true; }
        if (entity.getReviewContent()        != null) { update.set(r.reviewContent,        entity.getReviewContent());        hasAny = true; }
        if (entity.getRating()               != null) { update.set(r.rating,               entity.getRating());               hasAny = true; }
        if (entity.getHelpfulCnt()           != null) { update.set(r.helpfulCnt,           entity.getHelpfulCnt());           hasAny = true; }
        if (entity.getUnhelpfulCnt()         != null) { update.set(r.unhelpfulCnt,         entity.getUnhelpfulCnt());         hasAny = true; }
        if (entity.getReviewStatusCd()       != null) { update.set(r.reviewStatusCd,       entity.getReviewStatusCd());       hasAny = true; }
        if (entity.getReviewStatusCdBefore() != null) { update.set(r.reviewStatusCdBefore, entity.getReviewStatusCdBefore()); hasAny = true; }
        if (entity.getReviewDate()           != null) { update.set(r.reviewDate,           entity.getReviewDate());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(r.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(r.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(r.reviewId.eq(entity.getReviewId())).execute();
        return (int) affected;
    }
}
