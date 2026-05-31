package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmBlogReply QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogReplyRepositoryImpl implements QCmBlogReplyRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogReplyRepositoryImpl";
    private static final QCmBlogReply r = QCmBlogReply.cmBlogReply;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmBlogReplyDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogReplyDto.Item.class,
                        r.commentId, r.siteId, r.blogId, r.parentCommentId,
                        r.writerId, r.writerNm, r.blogCommentContent,
                        r.commentStatusCd, r.commentStatusCdBefore,
                        r.regBy, r.regDate, r.updBy, r.updDate
                ))
                .from(r);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogReplyDto.Item> selectById(String commentId) {
        CmBlogReplyDto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(r.commentId.eq(commentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogReplyDto.Item> selectList(CmBlogReplyDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogReplyDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andBlogIds(search),
                andBlogId(search),
                andSiteId(search),
                andCommentId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public CmBlogReplyDto.PageResponse selectPageList(CmBlogReplyDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogReplyDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andBlogIds(search),
                andBlogId(search),
                andSiteId(search),
                andCommentId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogReplyDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(r.count())
                .from(r)
                .where(
                andBlogIds(search),
                andBlogId(search),
                andSiteId(search),
                andCommentId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        CmBlogReplyDto.PageResponse res = new CmBlogReplyDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* blogId IN */
    private BooleanExpression andBlogIds(CmBlogReplyDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getBlogIds())
                ? r.blogId.in(search.getBlogIds()) : null;
    }

    /* blogId 정확 일치 */
    private BooleanExpression andBlogId(CmBlogReplyDto.Request search) {
        return search != null && StringUtils.hasText(search.getBlogId())
                ? r.blogId.eq(search.getBlogId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(CmBlogReplyDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? r.siteId.eq(search.getSiteId()) : null;
    }

    /* commentId 정확 일치 */
    private BooleanExpression andCommentId(CmBlogReplyDto.Request search) {
        return search != null && StringUtils.hasText(search.getCommentId())
                ? r.commentId.eq(search.getCommentId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(CmBlogReplyDto.Request search) {
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
    private BooleanExpression andSearchValue(CmBlogReplyDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",blogCommentContent,", r.blogCommentContent, pattern);
        or = orLike(or, all, types, ",blogId,", r.blogId, pattern);
        or = orLike(or, all, types, ",commentId,", r.commentId, pattern);
        or = orLike(or, all, types, ",commentStatusCd,", r.commentStatusCd, pattern);
        or = orLike(or, all, types, ",commentStatusCdBefore,", r.commentStatusCdBefore, pattern);
        or = orLike(or, all, types, ",parentCommentId,", r.parentCommentId, pattern);
        or = orLike(or, all, types, ",siteId,", r.siteId, pattern);
        or = orLike(or, all, types, ",writerId,", r.writerId, pattern);
        or = orLike(or, all, types, ",writerNm,", r.writerNm, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(CmBlogReplyDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.commentId));
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
                    orders.add(new OrderSpecifier(order, r.commentId));
                } else if ("writerNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.writerNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.commentId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlogReply entity) {
        if (entity.getCommentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()                != null) { update.set(r.siteId,                entity.getSiteId());                hasAny = true; }
        if (entity.getBlogId()                != null) { update.set(r.blogId,                entity.getBlogId());                hasAny = true; }
        if (entity.getParentCommentId()       != null) { update.set(r.parentCommentId,       entity.getParentCommentId());       hasAny = true; }
        if (entity.getWriterId()              != null) { update.set(r.writerId,              entity.getWriterId());              hasAny = true; }
        if (entity.getWriterNm()              != null) { update.set(r.writerNm,              entity.getWriterNm());              hasAny = true; }
        if (entity.getBlogCommentContent()    != null) { update.set(r.blogCommentContent,    entity.getBlogCommentContent());    hasAny = true; }
        if (entity.getCommentStatusCd()       != null) { update.set(r.commentStatusCd,       entity.getCommentStatusCd());       hasAny = true; }
        if (entity.getCommentStatusCdBefore() != null) { update.set(r.commentStatusCdBefore, entity.getCommentStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(r.updBy,                 entity.getUpdBy());                 hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(r.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(r.commentId.eq(entity.getCommentId())).execute();
        return (int) affected;
    }
}
