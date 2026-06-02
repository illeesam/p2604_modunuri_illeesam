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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdReviewComment QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdReviewCommentRepositoryImpl implements QPdReviewCommentRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdReviewCommentRepositoryImpl";
    private static final QPdReviewComment pdReviewComment = QPdReviewComment.pdReviewComment;

    /** 단건 조회 */
    private JPAQuery<PdReviewCommentDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdReviewCommentDto.Item.class,
                        pdReviewComment.reviewCommentId, pdReviewComment.siteId, pdReviewComment.reviewId, pdReviewComment.parentReplyId,
                        pdReviewComment.writerTypeCd, pdReviewComment.writerId, pdReviewComment.writerNm,
                        pdReviewComment.reviewReplyContent, pdReviewComment.replyStatusCd,
                        pdReviewComment.regBy, pdReviewComment.regDate, pdReviewComment.updBy, pdReviewComment.updDate
                ))
                .from(pdReviewComment);
    }

    @Override
    public Optional<PdReviewCommentDto.Item> selectById(String reviewCommentId) {
        PdReviewCommentDto.Item dto = baseSelColumnQuery()
                .where(pdReviewComment.reviewCommentId.eq(reviewCommentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdReviewCommentDto.Item> selectList(PdReviewCommentDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdReviewCommentDto.Item> query = baseSelColumnQuery().where(
                baseAndReviewIds(search),
                baseAndReviewId(search),
                baseAndSiteId(search),
                baseAndReviewCommentId(search),
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
    public PdReviewCommentDto.PageResponse selectPageData(PdReviewCommentDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndReviewIds(search),
                baseAndReviewId(search),
                baseAndSiteId(search),
                baseAndReviewCommentId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PdReviewCommentDto.Item> query = baseSelColumnQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdReviewCommentDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(pdReviewComment.count()).from(pdReviewComment).where(wheres).fetchOne();

        PdReviewCommentDto.PageResponse res = new PdReviewCommentDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    /** 검색조건 빌드 — Mapper XML pdReviewCommentCond 와 동일 동작 */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* reviewId IN */
    private BooleanExpression baseAndReviewIds(PdReviewCommentDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getReviewIds())
                ? pdReviewComment.reviewId.in(search.getReviewIds()) : null;
    }

    /* reviewId 정확 일치 */
    private BooleanExpression baseAndReviewId(PdReviewCommentDto.Request search) {
        return search != null && StringUtils.hasText(search.getReviewId())
                ? pdReviewComment.reviewId.eq(search.getReviewId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdReviewCommentDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdReviewComment.siteId.eq(search.getSiteId()) : null;
    }

    /* reviewCommentId 정확 일치 */
    private BooleanExpression baseAndReviewCommentId(PdReviewCommentDto.Request search) {
        return search != null && StringUtils.hasText(search.getReviewCommentId())
                ? pdReviewComment.reviewCommentId.eq(search.getReviewCommentId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdReviewCommentDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdReviewComment.regDate.goe(start).and(pdReviewComment.regDate.lt(endExcl));
            case "upd_date": return pdReviewComment.updDate.goe(start).and(pdReviewComment.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdReviewCommentDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",parentReplyId,", pdReviewComment.parentReplyId, pattern);
        or = orLike(or, all, types, ",replyStatusCd,", pdReviewComment.replyStatusCd, pattern);
        or = orLike(or, all, types, ",reviewCommentId,", pdReviewComment.reviewCommentId, pattern);
        or = orLike(or, all, types, ",reviewId,", pdReviewComment.reviewId, pattern);
        or = orLike(or, all, types, ",reviewReplyContent,", pdReviewComment.reviewReplyContent, pattern);
        or = orLike(or, all, types, ",siteId,", pdReviewComment.siteId, pattern);
        or = orLike(or, all, types, ",writerId,", pdReviewComment.writerId, pattern);
        or = orLike(or, all, types, ",writerNm,", pdReviewComment.writerNm, pattern);
        or = orLike(or, all, types, ",writerTypeCd,", pdReviewComment.writerTypeCd, pattern);
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
