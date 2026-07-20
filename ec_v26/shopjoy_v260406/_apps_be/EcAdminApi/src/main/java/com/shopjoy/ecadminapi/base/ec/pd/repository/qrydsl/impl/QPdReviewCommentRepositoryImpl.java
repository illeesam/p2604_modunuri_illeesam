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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PdReviewComment QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewCommentRepositoryImpl implements QPdReviewCommentRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdReviewCommentRepositoryImpl";
    private static final QPdReviewComment pdReviewComment = QPdReviewComment.pdReviewComment;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdReviewComment.regDate,
        "upd_date", pdReviewComment.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("parentReplyId", pdReviewComment.parentReplyId),
        Map.entry("replyStatusCd", pdReviewComment.replyStatusCd),
        Map.entry("reviewCommentId", pdReviewComment.reviewCommentId),
        Map.entry("reviewId", pdReviewComment.reviewId),
        Map.entry("reviewReplyContent", pdReviewComment.reviewReplyContent),
        Map.entry("siteId", pdReviewComment.siteId),
        Map.entry("writerId", pdReviewComment.writerId),
        Map.entry("writerNm", pdReviewComment.writerNm),
        Map.entry("writerTypeCd", pdReviewComment.writerTypeCd)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (Entity 주석 기준 — sy_code 미등록)
     * WRITER_TYPE_CD   {MEMBER: '회원', SELLER: '판매자', ADMIN: '관리자'}
     * REPLY_STATUS_CD  {ACTIVE: '정상', HIDDEN: '숨김', DELETED: '삭제'}
     */
    /** 단건 조회 */
    private JPAQuery<PdReviewCommentDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdReviewCommentDto.Item.class,
                        pdReviewComment.reviewCommentId,   // 댓글ID (PK)
                        pdReviewComment.siteId,              // 사이트ID
                        pdReviewComment.reviewId,            // 리뷰ID (pd_review.review_id)
                        pdReviewComment.parentReplyId,        // 상위댓글ID (대댓글)
                        pdReviewComment.writerTypeCd,          // 작성자유형 — {MEMBER: '회원', SELLER: '판매자', ADMIN: '관리자'}
                        pdReviewComment.writerId,            // 작성자ID
                        pdReviewComment.writerNm,            // 작성자명
                        pdReviewComment.reviewReplyContent,  // 댓글 내용
                        pdReviewComment.replyStatusCd,         // 상태 — {ACTIVE: '정상', HIDDEN: '숨김', DELETED: '삭제'}
                        pdReviewComment.regBy, pdReviewComment.regDate, pdReviewComment.updBy, pdReviewComment.updDate
                ))
                .from(pdReviewComment);
    }

    @Override
    public Optional<PdReviewCommentDto.Item> selectById(String reviewCommentId) {
        PdReviewCommentDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdReviewComment.reviewCommentId.eq(reviewCommentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdReviewCommentDto.Item> selectList(PdReviewCommentDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdReviewCommentDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pdReviewComment.reviewId, search.getReviewIds()),
                    QdslUtil.strEq(pdReviewComment.reviewId, search.getReviewId()),
                    QdslUtil.strEq(pdReviewComment.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdReviewComment.reviewCommentId, search.getReviewCommentId()),
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
    public PdReviewCommentDto.PageResponse selectPageData(PdReviewCommentDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pdReviewComment.reviewId, search.getReviewIds()),
                QdslUtil.strEq(pdReviewComment.reviewId, search.getReviewId()),
                QdslUtil.strEq(pdReviewComment.siteId, search.getSiteId()),
                QdslUtil.strEq(pdReviewComment.reviewCommentId, search.getReviewCommentId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdReviewCommentDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdReviewCommentDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdReviewComment.count())
                .where(wheres)
                .fetchOne();

        PdReviewCommentDto.PageResponse res = new PdReviewCommentDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    /** 검색조건 빌드 — Mapper XML pdReviewCommentCond 와 동일 동작 */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdReviewCommentDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdReviewCommentDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdReviewComment.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdReviewComment.reviewCommentId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("reviewCommentId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdReviewComment.reviewCommentId));
                } else if ("writerNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdReviewComment.writerNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdReviewComment.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdReviewComment.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdReviewComment.reviewCommentId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */

    @Override
    public int updateSelective(PdReviewComment entity) {
        if (entity.getReviewCommentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdReviewComment);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(pdReviewComment.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getReviewId()           != null) { update.set(pdReviewComment.reviewId,           entity.getReviewId());           hasAny = true; }
        if (entity.getParentReplyId()      != null) { update.set(pdReviewComment.parentReplyId,      entity.getParentReplyId());      hasAny = true; }
        if (entity.getWriterTypeCd()       != null) { update.set(pdReviewComment.writerTypeCd,       entity.getWriterTypeCd());       hasAny = true; }
        if (entity.getWriterId()           != null) { update.set(pdReviewComment.writerId,           entity.getWriterId());           hasAny = true; }
        if (entity.getWriterNm()           != null) { update.set(pdReviewComment.writerNm,           entity.getWriterNm());           hasAny = true; }
        if (entity.getReviewReplyContent() != null) { update.set(pdReviewComment.reviewReplyContent, entity.getReviewReplyContent()); hasAny = true; }
        if (entity.getReplyStatusCd()      != null) { update.set(pdReviewComment.replyStatusCd,      entity.getReplyStatusCd());      hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(pdReviewComment.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdReviewComment.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdReviewComment.reviewCommentId.eq(entity.getReviewCommentId())).execute();
        return (int) affected;
    }
}
