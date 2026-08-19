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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewCommentRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PdReviewComment(리뷰 댓글) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewCommentRepositoryImpl implements QPdReviewCommentRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdReviewCommentRepositoryImpl";
    private static final QPdReviewComment pdReviewComment = QPdReviewComment.pdReviewComment;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (Entity 주석 기준 — sy_code 미등록)
     * WRITER_TYPE_CD   {MEMBER: '회원', SELLER: '판매자', ADMIN: '관리자'}
     * REPLY_STATUS_CD  {ACTIVE: '정상', HIDDEN: '숨김', DELETED: '삭제'}
     */
    /** 단건 조회 */
    private JPAQuery<PdReviewCommentDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdReviewCommentDto.Item.class,
                        pdReviewComment.reviewCommentId,   // 댓글ID (PK)
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
        PdReviewCommentDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdReviewComment.reviewCommentId.eq(reviewCommentId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 */
    @Override
    public List<PdReviewCommentDto.Item> selectList(PdReviewCommentDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pdReviewComment.reviewId, search.getReviewIds()));
        whereList.add(QdslUtil.strEq(pdReviewComment.reviewId, search.getReviewId()));
        whereList.add(QdslUtil.strEq(pdReviewComment.reviewCommentId, search.getReviewCommentId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReviewComment.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReviewComment.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdReviewCommentDto.Item> query = baseSelColumnQuery()
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
        List<PdReviewCommentDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 */
    @Override
    public BasePage<PdReviewCommentDto.Item> selectPageData(PdReviewCommentDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pdReviewComment.reviewId, search.getReviewIds()));
        whereList.add(QdslUtil.strEq(pdReviewComment.reviewId, search.getReviewId()));
        whereList.add(QdslUtil.strEq(pdReviewComment.reviewCommentId, search.getReviewCommentId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReviewComment.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdReviewComment.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdReviewCommentDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdReviewCommentDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdReviewComment.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdReviewCommentDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    /** 검색조건 빌드 — Mapper XML pdReviewCommentCond 와 동일 동작 */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("parentReplyId", pdReviewComment.parentReplyId),
            QdslUtil.FieldDef.like("replyStatusCd", pdReviewComment.replyStatusCd),
            QdslUtil.FieldDef.like("reviewCommentId", pdReviewComment.reviewCommentId),
            QdslUtil.FieldDef.like("reviewId", pdReviewComment.reviewId),
            QdslUtil.FieldDef.like("reviewReplyContent", pdReviewComment.reviewReplyContent),
            QdslUtil.FieldDef.like("writerId", pdReviewComment.writerId),
            QdslUtil.FieldDef.like("writerNm", pdReviewComment.writerNm),
            QdslUtil.FieldDef.like("writerTypeCd", pdReviewComment.writerTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("reviewCommentId", pdReviewComment.reviewCommentId,
                   "writerNm", pdReviewComment.writerNm,
                   "regDate", pdReviewComment.regDate),
        new OrderSpecifier<>(Order.DESC, pdReviewComment.regDate),
        new OrderSpecifier<>(Order.ASC, pdReviewComment.reviewCommentId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdReviewComment entity) {
        if (entity.getReviewCommentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdReviewComment);
        boolean hasAny = false;

        if (entity.getReviewId()           != null) { update.set(pdReviewComment.reviewId,           entity.getReviewId());           hasAny = true; }
        if (entity.getParentReplyId()      != null) { update.set(pdReviewComment.parentReplyId,      entity.getParentReplyId());      hasAny = true; }
        if (entity.getWriterTypeCd()       != null) { update.set(pdReviewComment.writerTypeCd,       entity.getWriterTypeCd());       hasAny = true; }
        if (entity.getWriterId()           != null) { update.set(pdReviewComment.writerId,           entity.getWriterId());           hasAny = true; }
        if (entity.getWriterNm()           != null) { update.set(pdReviewComment.writerNm,           entity.getWriterNm());           hasAny = true; }
        if (entity.getReviewReplyContent() != null) { update.set(pdReviewComment.reviewReplyContent, entity.getReviewReplyContent()); hasAny = true; }
        if (entity.getReplyStatusCd()      != null) { update.set(pdReviewComment.replyStatusCd,      entity.getReplyStatusCd());      hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(pdReviewComment.updBy,              entity.getUpdBy());              hasAny = true; }
        update.set(pdReviewComment.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdReviewComment.reviewCommentId.eq(entity.getReviewCommentId())).execute();
        return (int) affected;
    }
}
