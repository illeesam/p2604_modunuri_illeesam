package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogReplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
                .where(r.commentId.eq(commentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogReplyDto.Item> selectList(CmBlogReplyDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogReplyDto.Item> query = buildBaseQuery().where(where);
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

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogReplyDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogReplyDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(r.count())
                .from(r)
                .where(where)
                .fetchOne();

        CmBlogReplyDto.PageResponse res = new CmBlogReplyDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(CmBlogReplyDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))    w.and(r.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getCommentId())) w.and(r.commentId.eq(s.getCommentId()));

        // searchValue + searchType (def_writer_nm)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_writer_nm,")) or.or(r.writerNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(CmBlogReplyDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
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
        if (entity.getUpdDate()               != null) { update.set(r.updDate,               entity.getUpdDate());               hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.commentId.eq(entity.getCommentId())).execute();
        return (int) affected;
    }
}
