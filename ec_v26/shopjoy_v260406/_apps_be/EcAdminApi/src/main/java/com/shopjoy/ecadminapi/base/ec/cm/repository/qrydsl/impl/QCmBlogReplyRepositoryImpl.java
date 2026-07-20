package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogReplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmBlogReply QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogReplyRepositoryImpl implements QCmBlogReplyRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogReplyRepositoryImpl";
    private static final QCmBlogReply cmBlogReply = QCmBlogReply.cmBlogReply;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", cmBlogReply.regDate,
        "upd_date", cmBlogReply.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("blogCommentContent", cmBlogReply.blogCommentContent),
        Map.entry("blogId", cmBlogReply.blogId),
        Map.entry("commentId", cmBlogReply.commentId),
        Map.entry("commentStatusCd", cmBlogReply.commentStatusCd),
        Map.entry("commentStatusCdBefore", cmBlogReply.commentStatusCdBefore),
        Map.entry("parentCommentId", cmBlogReply.parentCommentId),
        Map.entry("siteId", cmBlogReply.siteId),
        Map.entry("writerId", cmBlogReply.writerId),
        Map.entry("writerNm", cmBlogReply.writerNm)
    );

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmBlogReplyDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogReplyDto.Item.class,
                        cmBlogReply.commentId, cmBlogReply.siteId, cmBlogReply.blogId, cmBlogReply.parentCommentId,
                        cmBlogReply.writerId, cmBlogReply.writerNm, cmBlogReply.blogCommentContent,
                        cmBlogReply.commentStatusCd, cmBlogReply.commentStatusCdBefore,
                        cmBlogReply.regBy, cmBlogReply.regDate, cmBlogReply.updBy, cmBlogReply.updDate
                ))
                .from(cmBlogReply);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogReplyDto.Item> selectById(String commentId) {
        CmBlogReplyDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogReply.commentId.eq(commentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogReplyDto.Item> selectList(CmBlogReplyDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogReplyDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strIn(cmBlogReply.blogId, search.getBlogIds()),
                QdslUtil.strEq(cmBlogReply.blogId, search.getBlogId()),
                QdslUtil.strEq(cmBlogReply.siteId, search.getSiteId()),
                QdslUtil.strEq(cmBlogReply.commentId, search.getCommentId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
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
    public CmBlogReplyDto.PageResponse selectPageData(CmBlogReplyDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(cmBlogReply.blogId, search.getBlogIds()),
                QdslUtil.strEq(cmBlogReply.blogId, search.getBlogId()),
                QdslUtil.strEq(cmBlogReply.siteId, search.getSiteId()),
                QdslUtil.strEq(cmBlogReply.commentId, search.getCommentId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmBlogReplyDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmBlogReplyDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogReply.count())
                .where(wheres)
                .fetchOne();

        CmBlogReplyDto.PageResponse res = new CmBlogReplyDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(CmBlogReplyDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmBlogReplyDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, cmBlogReply.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogReply.commentId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("commentId".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogReply.commentId));
                } else if ("writerNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogReply.writerNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogReply.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, cmBlogReply.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogReply.commentId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlogReply entity) {
        if (entity.getCommentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogReply);
        boolean hasAny = false;

        if (entity.getSiteId()                != null) { update.set(cmBlogReply.siteId,                entity.getSiteId());                hasAny = true; }
        if (entity.getBlogId()                != null) { update.set(cmBlogReply.blogId,                entity.getBlogId());                hasAny = true; }
        if (entity.getParentCommentId()       != null) { update.set(cmBlogReply.parentCommentId,       entity.getParentCommentId());       hasAny = true; }
        if (entity.getWriterId()              != null) { update.set(cmBlogReply.writerId,              entity.getWriterId());              hasAny = true; }
        if (entity.getWriterNm()              != null) { update.set(cmBlogReply.writerNm,              entity.getWriterNm());              hasAny = true; }
        if (entity.getBlogCommentContent()    != null) { update.set(cmBlogReply.blogCommentContent,    entity.getBlogCommentContent());    hasAny = true; }
        if (entity.getCommentStatusCd()       != null) { update.set(cmBlogReply.commentStatusCd,       entity.getCommentStatusCd());       hasAny = true; }
        if (entity.getCommentStatusCdBefore() != null) { update.set(cmBlogReply.commentStatusCdBefore, entity.getCommentStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(cmBlogReply.updBy,                 entity.getUpdBy());                 hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmBlogReply.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlogReply.commentId.eq(entity.getCommentId())).execute();
        return (int) affected;
    }
}
