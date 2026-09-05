package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReview;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PdReview(상품 리뷰) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewRepositoryImpl implements QPdReviewRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdReviewRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdReview pdReview = QPdReview.pdReview;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 등록 기준)
     * REVIEW_STATUS_CD  {ACTIVE: '정상', HIDDEN: '숨김', DELETED: '삭제'}
     */
    /** 단건 조회 */
    private JPAQuery<PdReviewDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdReviewDto.Item.class,
                        pdReview.reviewId,       // 리뷰ID (PK, YYMMDDhhmmss+rand4)
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
                        pdReview.regBy,      // 등록자
                        pdReview.regDate,    // 등록일시
                        pdReview.updBy,      // 수정자
                        pdReview.updDate,    // 수정일시
                        pdReview.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdReview.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdReview)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdReview.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdReview.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdReview.siteId)) // 사이트

                ;
    }

    @Override
    public Optional<PdReviewDto.Item> selectById(String reviewId) {
        PdReviewDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdReview.reviewId.eq(reviewId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PdReviewDto.Item> selectList(PdReviewDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdReview.reviewId, search.getReviewId())); // 리뷰ID (단건 조회 필터)
        whereList.add(QdslUtil.strEq(pdReview.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdReview.reviewStatusCd, search.getReviewStatusCd())); // 리뷰상태 필터
        whereList.add(andRatingGoe(search));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReview.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReview.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdReview.siteId, search.getSiteId())); // 사이트ID (검색 필터)

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdReviewDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PdReviewDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 */
    @Override
    public BasePage<PdReviewDto.Item> selectPageData(PdReviewDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdReview.reviewId, search.getReviewId())); // 리뷰ID (단건 조회 필터)
        whereList.add(QdslUtil.strEq(pdReview.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdReview.reviewStatusCd, search.getReviewStatusCd())); // 리뷰상태 필터
        whereList.add(andRatingGoe(search));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReview.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReview.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdReview.siteId, search.getSiteId())); // 사이트ID (검색 필터)
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdReviewDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdReviewDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdReview.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdReviewDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query (DTO Item 필드만 매핑) */
    /** 검색조건 빌드 — Mapper XML pdReviewCond 와 동일 동작 */
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

    /* searchType 예: "memberId,prodId,reviewContent,reviewId,reviewStatusCd" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("memberId", pdReview.memberId), // 회원ID (mb_member.member_id)
            QdslUtil.FieldDef.like("prodId", pdReview.prodId), // 상품ID 필터
            QdslUtil.FieldDef.like("reviewContent", pdReview.reviewContent), // 리뷰 내용
            QdslUtil.FieldDef.like("reviewId", pdReview.reviewId), // 리뷰ID (단건 조회 필터)
            QdslUtil.FieldDef.like("reviewStatusCd", pdReview.reviewStatusCd), // 리뷰상태 필터
            QdslUtil.FieldDef.like("reviewStatusCdBefore", pdReview.reviewStatusCdBefore), // 변경 전 리뷰상태 — REVIEW_STATUS_CD
            QdslUtil.FieldDef.like("reviewTitle", pdReview.reviewTitle) // 리뷰 제목
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("reviewId", pdReview.reviewId,
                   "reviewTitle", pdReview.reviewTitle,
                   "regDate", pdReview.regDate),
        new OrderSpecifier<>(Order.DESC, pdReview.regDate),
        new OrderSpecifier<>(Order.ASC, pdReview.reviewId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdReview entity) {
        if (entity.getReviewId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdReview);
        boolean hasAny = false;

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
        update.set(pdReview.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdReview.reviewId.eq(entity.getReviewId())).execute();
        return (int) affected;
    }
}
