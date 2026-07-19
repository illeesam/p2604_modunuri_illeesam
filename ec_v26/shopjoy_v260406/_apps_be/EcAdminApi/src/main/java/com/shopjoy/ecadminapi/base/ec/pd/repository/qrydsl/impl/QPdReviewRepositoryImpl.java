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

import java.math.BigDecimal;
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
    private static final QPdReview pdReview = QPdReview.pdReview;

    /** 단건 조회 */
    private JPAQuery<PdReviewDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdReviewDto.Item.class,
                        pdReview.reviewId, pdReview.siteId, pdReview.prodId, pdReview.memberId,
                        pdReview.reviewTitle, pdReview.reviewContent, pdReview.rating,
                        pdReview.helpfulCnt, pdReview.unhelpfulCnt,
                        pdReview.reviewStatusCd, pdReview.reviewStatusCdBefore,
                        pdReview.reviewDate,
                        pdReview.regBy, pdReview.regDate, pdReview.updBy, pdReview.updDate
                ))
                .from(pdReview);
    }

    @Override
    public Optional<PdReviewDto.Item> selectById(String reviewId) {
        PdReviewDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdReview.reviewId.eq(reviewId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PdReviewDto.Item> selectList(PdReviewDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdReviewDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andReviewIdEq(search),
                    andProdIdEq(search),
                    andReviewStatusCdEq(search),
                    andRatingGoe(search),
                    andDateRangeBetween(search),
                    andSearchValueLike(search)
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

    /** 페이지 목록 */
    @Override
    public PdReviewDto.PageResponse selectPageData(PdReviewDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andReviewIdEq(search),
                andProdIdEq(search),
                andReviewStatusCdEq(search),
                andRatingGoe(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdReviewDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdReviewDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdReview.count())
                .where(wheres)
                .fetchOne();

        PdReviewDto.PageResponse res = new PdReviewDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query (DTO Item 필드만 매핑) */
    /** 검색조건 빌드 — Mapper XML pdReviewCond 와 동일 동작 */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(PdReviewDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdReview.siteId.eq(search.getSiteId()) : null;
    }

    /* reviewId 정확 일치 */
    private BooleanExpression andReviewIdEq(PdReviewDto.Request search) {
        return search != null && StringUtils.hasText(search.getReviewId())
                ? pdReview.reviewId.eq(search.getReviewId()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression andProdIdEq(PdReviewDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? pdReview.prodId.eq(search.getProdId()) : null;
    }

    /* reviewStatusCd 정확 일치 (REVIEW_STATUS 코드) */
    private BooleanExpression andReviewStatusCdEq(PdReviewDto.Request search) {
        return search != null && StringUtils.hasText(search.getReviewStatusCd())
                ? pdReview.reviewStatusCd.eq(search.getReviewStatusCd()) : null;
    }

    /* rating — 점수대(floor) 범위 (예: "4" => 4.0 이상 5.0 미만) */
    private BooleanExpression andRatingGoe(PdReviewDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getRating())) return null;
        int floor;
        try {
            floor = Integer.parseInt(search.getRating().trim());
        } catch (NumberFormatException e) {
            return null;
        }
        BigDecimal lo = BigDecimal.valueOf(floor);
        BigDecimal hi = BigDecimal.valueOf(floor + 1L);
        return pdReview.rating.goe(lo).and(pdReview.rating.lt(hi));
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(PdReviewDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdReview.regDate.goe(start).and(pdReview.regDate.lt(endExcl));
            case "upd_date": return pdReview.updDate.goe(start).and(pdReview.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(PdReviewDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",memberId,", pdReview.memberId, pattern);
        or = orLike(or, all, types, ",prodId,", pdReview.prodId, pattern);
        or = orLike(or, all, types, ",reviewContent,", pdReview.reviewContent, pattern);
        or = orLike(or, all, types, ",reviewId,", pdReview.reviewId, pattern);
        or = orLike(or, all, types, ",reviewStatusCd,", pdReview.reviewStatusCd, pattern);
        or = orLike(or, all, types, ",reviewStatusCdBefore,", pdReview.reviewStatusCdBefore, pattern);
        or = orLike(or, all, types, ",reviewTitle,", pdReview.reviewTitle, pattern);
        or = orLike(or, all, types, ",siteId,", pdReview.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, pdReview.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdReview.reviewId));
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
                    orders.add(new OrderSpecifier(order, pdReview.reviewId));
                } else if ("reviewTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdReview.reviewTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdReview.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdReview.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdReview.reviewId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */

    @Override
    public int updateSelective(PdReview entity) {
        if (entity.getReviewId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdReview);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(pdReview.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getProdId()               != null) { update.set(pdReview.prodId,               entity.getProdId());               hasAny = true; }
        if (entity.getMemberId()             != null) { update.set(pdReview.memberId,             entity.getMemberId());             hasAny = true; }
        if (entity.getReviewTitle()          != null) { update.set(pdReview.reviewTitle,          entity.getReviewTitle());          hasAny = true; }
        if (entity.getReviewContent()        != null) { update.set(pdReview.reviewContent,        entity.getReviewContent());        hasAny = true; }
        if (entity.getRating()               != null) { update.set(pdReview.rating,               entity.getRating());               hasAny = true; }
        if (entity.getHelpfulCnt()           != null) { update.set(pdReview.helpfulCnt,           entity.getHelpfulCnt());           hasAny = true; }
        if (entity.getUnhelpfulCnt()         != null) { update.set(pdReview.unhelpfulCnt,         entity.getUnhelpfulCnt());         hasAny = true; }
        if (entity.getReviewStatusCd()       != null) { update.set(pdReview.reviewStatusCd,       entity.getReviewStatusCd());       hasAny = true; }
        if (entity.getReviewStatusCdBefore() != null) { update.set(pdReview.reviewStatusCdBefore, entity.getReviewStatusCdBefore()); hasAny = true; }
        if (entity.getReviewDate()           != null) { update.set(pdReview.reviewDate,           entity.getReviewDate());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(pdReview.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdReview.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdReview.reviewId.eq(entity.getReviewId())).execute();
        return (int) affected;
    }
}
