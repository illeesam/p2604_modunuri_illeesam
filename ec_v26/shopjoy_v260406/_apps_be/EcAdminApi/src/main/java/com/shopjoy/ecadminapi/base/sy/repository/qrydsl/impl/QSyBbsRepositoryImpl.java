package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBbs;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyBbs QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBbsRepositoryImpl implements QSyBbsRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyBbs b = QSyBbs.syBbs;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 게시판 게시물 키조회 */
    @Override
    public Optional<SyBbsDto.Item> selectById(String bbsId) {
        SyBbsDto.Item dto = baseQuery().where(b.bbsId.eq(bbsId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시판 게시물 목록조회 */
    @Override
    public List<SyBbsDto.Item> selectList(SyBbsDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBbsDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 게시판 게시물 페이지조회 */
    @Override
    public SyBbsDto.PageResponse selectPageList(SyBbsDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyBbsDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyBbsDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(b.count()).from(b).where(where).fetchOne();

        SyBbsDto.PageResponse res = new SyBbsDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 게시판 게시물 baseQuery */
    private JPAQuery<SyBbsDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyBbsDto.Item.class,
                        b.bbsId, b.siteId, b.bbmId, b.parentBbsId, b.memberId, b.authorNm,
                        b.bbsTitle, b.contentHtml, b.attachGrpId, b.viewCount, b.likeCount,
                        b.commentCount, b.isFixed, b.bbsStatusCd, b.pathId,
                        b.regBy, b.regDate, b.updBy, b.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(b)
                .leftJoin(ste).on(ste.siteId.eq(b.siteId));
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(SyBbsDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(b.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBbsId()))  w.and(b.bbsId.eq(s.getBbsId()));
        if (StringUtils.hasText(s.getPathId())) w.and(b.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getStatus())) w.and(b.bbsStatusCd.eq(s.getStatus()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_author,")) or.or(b.authorNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_title,"))  or.or(b.bbsTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(b.regDate.goe(ds.atStartOfDay())).and(b.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(b.updDate.goe(ds.atStartOfDay())).and(b.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyBbsDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, b.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("bbsId".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.bbsId));
                } else if ("authorNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.authorNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.regDate));
                }
            }
        }
        return orders;
    }

    /* 게시판 게시물 수정 */
    @Override
    public int updateSelective(SyBbs entity) {
        if (entity.getBbsId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(b.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getBbmId()        != null) { update.set(b.bbmId,        entity.getBbmId());        hasAny = true; }
        if (entity.getParentBbsId()  != null) { update.set(b.parentBbsId,  entity.getParentBbsId());  hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(b.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getAuthorNm()     != null) { update.set(b.authorNm,     entity.getAuthorNm());     hasAny = true; }
        if (entity.getBbsTitle()     != null) { update.set(b.bbsTitle,     entity.getBbsTitle());     hasAny = true; }
        if (entity.getContentHtml()  != null) { update.set(b.contentHtml,  entity.getContentHtml());  hasAny = true; }
        if (entity.getAttachGrpId()  != null) { update.set(b.attachGrpId,  entity.getAttachGrpId());  hasAny = true; }
        if (entity.getViewCount()    != null) { update.set(b.viewCount,    entity.getViewCount());    hasAny = true; }
        if (entity.getLikeCount()    != null) { update.set(b.likeCount,    entity.getLikeCount());    hasAny = true; }
        if (entity.getCommentCount() != null) { update.set(b.commentCount, entity.getCommentCount()); hasAny = true; }
        if (entity.getIsFixed()      != null) { update.set(b.isFixed,      entity.getIsFixed());      hasAny = true; }
        if (entity.getBbsStatusCd()  != null) { update.set(b.bbsStatusCd,  entity.getBbsStatusCd());  hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(b.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(b.updDate,      entity.getUpdDate());      hasAny = true; }
        if (entity.getPathId()       != null) { update.set(b.pathId,       entity.getPathId());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(b.bbsId.eq(entity.getBbsId())).execute();
        return (int) affected;
    }
}
