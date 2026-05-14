package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdReviewCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final QPdReviewComment c = QPdReviewComment.pdReviewComment;

    /** 단건 조회 */
    @Override
    public Optional<PdReviewCommentDto.Item> selectById(String reviewCommentId) {
        PdReviewCommentDto.Item dto = baseQuery()
                .where(c.reviewCommentId.eq(reviewCommentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdReviewCommentDto.Item> selectList(PdReviewCommentDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdReviewCommentDto.Item> query = baseQuery().where(where);
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
    public PdReviewCommentDto.PageResponse selectPageList(PdReviewCommentDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdReviewCommentDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdReviewCommentDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(c.count()).from(c).where(where).fetchOne();

        PdReviewCommentDto.PageResponse res = new PdReviewCommentDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    private JPAQuery<PdReviewCommentDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdReviewCommentDto.Item.class,
                        c.reviewCommentId, c.siteId, c.reviewId, c.parentReplyId,
                        c.writerTypeCd, c.writerId, c.writerNm,
                        c.reviewReplyContent, c.replyStatusCd,
                        c.regBy, c.regDate, c.updBy, c.updDate
                ))
                .from(c);
    }

    /** 검색조건 빌드 — Mapper XML pdReviewCommentCond 와 동일 동작 */
    private BooleanBuilder buildCondition(PdReviewCommentDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))          w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getReviewCommentId())) w.and(c.reviewCommentId.eq(s.getReviewCommentId()));

        // searchValue + searchTypes (def_writer_nm)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all  = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_writer_nm")) or.or(c.writerNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
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
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
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
                    orders.add(new OrderSpecifier(order, c.reviewCommentId));
                } else if ("writerNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.writerNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdReviewComment entity) {
        if (entity.getReviewCommentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(c.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getReviewId()           != null) { update.set(c.reviewId,           entity.getReviewId());           hasAny = true; }
        if (entity.getParentReplyId()      != null) { update.set(c.parentReplyId,      entity.getParentReplyId());      hasAny = true; }
        if (entity.getWriterTypeCd()       != null) { update.set(c.writerTypeCd,       entity.getWriterTypeCd());       hasAny = true; }
        if (entity.getWriterId()           != null) { update.set(c.writerId,           entity.getWriterId());           hasAny = true; }
        if (entity.getWriterNm()           != null) { update.set(c.writerNm,           entity.getWriterNm());           hasAny = true; }
        if (entity.getReviewReplyContent() != null) { update.set(c.reviewReplyContent, entity.getReviewReplyContent()); hasAny = true; }
        if (entity.getReplyStatusCd()      != null) { update.set(c.replyStatusCd,      entity.getReplyStatusCd());      hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(c.updBy,              entity.getUpdBy());              hasAny = true; }
        if (entity.getUpdDate()            != null) { update.set(c.updDate,            entity.getUpdDate());            hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.reviewCommentId.eq(entity.getReviewCommentId())).execute();
        return (int) affected;
    }
}
