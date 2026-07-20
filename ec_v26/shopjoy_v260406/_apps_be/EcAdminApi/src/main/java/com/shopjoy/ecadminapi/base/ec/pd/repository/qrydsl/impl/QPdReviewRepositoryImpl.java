package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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
import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PdReview QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewRepositoryImpl implements QPdReviewRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdReviewRepositoryImpl";
    private static final QPdReview pdReview = QPdReview.pdReview;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdReview.regDate,
        "upd_date", pdReview.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("memberId", pdReview.memberId),
        Map.entry("prodId", pdReview.prodId),
        Map.entry("reviewContent", pdReview.reviewContent),
        Map.entry("reviewId", pdReview.reviewId),
        Map.entry("reviewStatusCd", pdReview.reviewStatusCd),
        Map.entry("reviewStatusCdBefore", pdReview.reviewStatusCdBefore),
        Map.entry("reviewTitle", pdReview.reviewTitle),
        Map.entry("siteId", pdReview.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 등록 기준)
     * REVIEW_STATUS_CD  {ACTIVE: '정상', HIDDEN: '숨김', DELETED: '삭제'}
     */
    /** 단건 조회 */
    private JPAQuery<PdReviewDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdReviewDto.Item.class,
                        pdReview.reviewId,       // 리뷰ID (PK, YYMMDDhhmmss+rand4)
                        pdReview.siteId,          // 사이트ID (sy_site.site_id)
                        pdReview.prodId,          // 상품ID (pd_prod.prod_id)
                        pdReview.memberId,        // 회원ID (mb_member.member_id)
                        pdReview.reviewTitle,     // 리뷰 제목
                        pdReview.reviewContent,  // 리뷰 내용
                        pdReview.rating,          // 평점 (1.0~5.0)
                        pdReview.helpfulCnt,      // 도움이 돼요 수
                        pdReview.unhelpfulCnt,    // 도움이 안 돼요 수
                        pdReview.reviewStatusCd,           // 상태 — {ACTIVE: '정상', HIDDEN: '숨김', DELETED: '삭제'}
                        pdReview.reviewStatusCdBefore,     // 변경 전 리뷰상태 — 동일 코드그룹
                        pdReview.reviewDate,      // 리뷰작성일
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
                    QdslUtil.strEq(pdReview.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdReview.reviewId, search.getReviewId()),
                    QdslUtil.strEq(pdReview.prodId, search.getProdId()),
                    QdslUtil.strEq(pdReview.reviewStatusCd, search.getReviewStatusCd()),
                    andRatingGoe(search),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
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
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdReview.siteId, search.getSiteId()),
                QdslUtil.strEq(pdReview.reviewId, search.getReviewId()),
                QdslUtil.strEq(pdReview.prodId, search.getProdId()),
                QdslUtil.strEq(pdReview.reviewStatusCd, search.getReviewStatusCd()),
                andRatingGoe(search),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

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

private BooleanExpression andSearchValueLike(PdReviewDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
