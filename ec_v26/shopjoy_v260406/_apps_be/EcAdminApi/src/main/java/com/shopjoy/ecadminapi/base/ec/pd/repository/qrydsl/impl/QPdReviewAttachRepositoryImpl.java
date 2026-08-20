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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReview;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewAttachRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdReviewAttach(리뷰 이미지/동영상) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewAttachRepositoryImpl implements QPdReviewAttachRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdReviewAttachRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdReviewAttach pdReviewAttach = QPdReviewAttach.pdReviewAttach;
    private static final QPdReview       pdReview = QPdReview.pdReview;    /*
     * baseQuerySingle / baseQueryWithJoin — 코드성 필드 예시 코드값 (sy_code 등록 기준)
     * MEDIA_TYPE_CD  {IMAGE: '이미지', VIDEO: '동영상', DOCUMENT: '문서'}
     */
    /** selectById 용 base query — pd_review JOIN 없음 */
    private JPAQuery<PdReviewAttachDto.Item> baseQuerySingle() {
        return queryFactory
                .select(Projections.bean(PdReviewAttachDto.Item.class,
                        pdReviewAttach.reviewAttachId,   // 미디어ID (PK)
                        pdReviewAttach.reviewId,           // 리뷰ID (pd_review.review_id)
                        pdReviewAttach.attachId,           // 첨부파일ID (sy_attach.attach_id) — url·파일명 여기서 조회
                        pdReviewAttach.mediaTypeCd,         // 미디어유형 — {IMAGE: '이미지', VIDEO: '동영상', DOCUMENT: '문서'}
                        pdReviewAttach.thumbUrl,           // 동영상 썸네일URL (이미지는 sy_attach.url 사용)
                        pdReviewAttach.sortOrd,            // 정렬순서
                        pdReviewAttach.regBy,      // 등록자
                        pdReviewAttach.regDate,    // 등록일시
                        pdReviewAttach.updBy,      // 수정자
                        pdReviewAttach.updDate,    // 수정일시
                        pdReviewAttach.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdReviewAttach.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdReviewAttach)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdReviewAttach.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdReviewAttach.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdReviewAttach.siteId)) // 사이트

                ;
    }

    /** 단건 조회 */
    @Override
    public Optional<PdReviewAttachDto.Item> selectById(String reviewAttachId) {
        PdReviewAttachDto.Item dtl = baseQuerySingle()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdReviewAttach.reviewAttachId.eq(reviewAttachId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 */
    @Override
    public List<PdReviewAttachDto.Item> selectList(PdReviewAttachDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pdReviewAttach.reviewId, search.getReviewIds()));
        whereList.add(QdslUtil.strEq(pdReviewAttach.reviewId, search.getReviewId()));
        whereList.add(QdslUtil.strEq(pdReviewAttach.reviewAttachId, search.getReviewAttachId()));
        whereList.add(QdslUtil.strEq(pdReview.prodId, search.getProdId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReviewAttach.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReviewAttach.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdReviewAttach.siteId, search.getSiteId()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        List<OrderSpecifier<?>> orderList = buildOrder(search, true);

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdReviewAttachDto.Item> query = baseQueryWithJoin().where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PdReviewAttachDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 */
    @Override
    public BasePage<PdReviewAttachDto.Item> selectPageData(PdReviewAttachDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search, false);
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pdReviewAttach.reviewId, search.getReviewIds()));
        whereList.add(QdslUtil.strEq(pdReviewAttach.reviewId, search.getReviewId()));
        whereList.add(QdslUtil.strEq(pdReviewAttach.reviewAttachId, search.getReviewAttachId()));
        whereList.add(QdslUtil.strEq(pdReview.prodId, search.getProdId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReviewAttach.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReviewAttach.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdReviewAttach.siteId, search.getSiteId()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdReviewAttachDto.Item> query = baseQueryWithJoin();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdReviewAttachDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdReviewAttach.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdReviewAttachDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** 목록/페이지 용 base query — pd_review LEFT JOIN 포함 (prodId 조건 지원) */
    private JPAQuery<PdReviewAttachDto.Item> baseQueryWithJoin() {
        return queryFactory
                .select(Projections.bean(PdReviewAttachDto.Item.class,
                        pdReviewAttach.reviewAttachId,   // 미디어ID (PK)
                        pdReviewAttach.reviewId,           // 리뷰ID (pd_review.review_id)
                        pdReviewAttach.attachId,           // 첨부파일ID (sy_attach.attach_id)
                        pdReviewAttach.mediaTypeCd,         // 미디어유형 — {IMAGE: '이미지', VIDEO: '동영상', DOCUMENT: '문서'}
                        pdReviewAttach.thumbUrl,           // 동영상 썸네일URL
                        pdReviewAttach.sortOrd,            // 정렬순서
                        pdReviewAttach.regBy,      // 등록자
                        pdReviewAttach.regDate,    // 등록일시
                        pdReviewAttach.updBy,      // 수정자
                        pdReviewAttach.updDate,    // 수정일시
                        pdReviewAttach.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdReviewAttach.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdReviewAttach)
                .innerJoin(pdReview).on(pdReview.reviewId.eq(pdReviewAttach.reviewId)) // 리뷰
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdReviewAttach.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdReviewAttach.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdReviewAttach.siteId)) // 사이트

                ;
    }

    /** 검색조건 빌드 — Mapper XML pdReviewAttachCond 와 동일 동작 */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("attachId", pdReviewAttach.attachId),
            QdslUtil.FieldDef.like("mediaTypeCd", pdReviewAttach.mediaTypeCd),
            QdslUtil.FieldDef.like("reviewAttachId", pdReviewAttach.reviewAttachId),
            QdslUtil.FieldDef.like("reviewId", pdReviewAttach.reviewId),
            QdslUtil.FieldDef.like("thumbUrl", pdReviewAttach.thumbUrl)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdReviewAttachDto.Request s, boolean withSortOrd) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = QdslUtil.sortOf(s);
        if (StringUtils.hasText(sort)) {
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

        if (entity.getReviewId()    != null) { update.set(pdReviewAttach.reviewId,    entity.getReviewId());    hasAny = true; }
        if (entity.getAttachId()    != null) { update.set(pdReviewAttach.attachId,    entity.getAttachId());    hasAny = true; }
        if (entity.getMediaTypeCd() != null) { update.set(pdReviewAttach.mediaTypeCd, entity.getMediaTypeCd()); hasAny = true; }
        if (entity.getThumbUrl()    != null) { update.set(pdReviewAttach.thumbUrl,    entity.getThumbUrl());    hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(pdReviewAttach.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(pdReviewAttach.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(pdReviewAttach.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdReviewAttach.reviewAttachId.eq(entity.getReviewAttachId())).execute();
        return (int) affected;
    }
}
