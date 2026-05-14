package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmBlog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogRepositoryImpl implements QCmBlogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QCmBlog b = QCmBlog.cmBlog;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmBlogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogDto.Item.class,
                        b.blogId, b.siteId, b.blogCateId, b.blogTitle, b.blogSummary,
                        b.blogContent, b.blogAuthor, b.prodId, b.viewCount,
                        b.useYn, b.isNotice,
                        b.regBy, b.regDate, b.updBy, b.updDate
                ))
                .from(b);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogDto.Item> selectById(String blogId) {
        CmBlogDto.Item dto = buildBaseQuery()
                .where(b.blogId.eq(blogId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<CmBlogDto.Item> selectList(CmBlogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogDto.Item> query = buildBaseQuery().where(where);
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
    public CmBlogDto.PageResponse selectPageList(CmBlogDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(b.count())
                .from(b)
                .where(where)
                .fetchOne();

        CmBlogDto.PageResponse res = new CmBlogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    private BooleanBuilder buildCondition(CmBlogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(b.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBlogId()))     w.and(b.blogId.eq(s.getBlogId()));
        if (StringUtils.hasText(s.getUseYn()))      w.and(b.useYn.eq(s.getUseYn()));

        // searchValue + searchTypes (def_blog_title | def_blog_author)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all  = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_blog_title"))  or.or(b.blogTitle.likeIgnoreCase(pattern));
            if (all || types.contains("def_blog_author")) or.or(b.blogAuthor.likeIgnoreCase(pattern));
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
                    w.and(b.regDate.goe(start)).and(b.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(b.updDate.goe(start)).and(b.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /** 정렬조건 빌드 */
    @SuppressWarnings({"rawtypes", "unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmBlogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, b.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  b.blogId));    break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, b.blogId));    break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  b.blogTitle)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, b.blogTitle)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  b.regDate));   break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, b.regDate));   break;
            default:         orders.add(new OrderSpecifier(Order.DESC, b.regDate));   break;
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlog entity) {
        if (entity.getBlogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(b.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getBlogCateId()  != null) { update.set(b.blogCateId,  entity.getBlogCateId());  hasAny = true; }
        if (entity.getBlogTitle()   != null) { update.set(b.blogTitle,   entity.getBlogTitle());   hasAny = true; }
        if (entity.getBlogSummary() != null) { update.set(b.blogSummary, entity.getBlogSummary()); hasAny = true; }
        if (entity.getBlogContent() != null) { update.set(b.blogContent, entity.getBlogContent()); hasAny = true; }
        if (entity.getBlogAuthor()  != null) { update.set(b.blogAuthor,  entity.getBlogAuthor());  hasAny = true; }
        if (entity.getProdId()      != null) { update.set(b.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getViewCount()   != null) { update.set(b.viewCount,   entity.getViewCount());   hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(b.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getIsNotice()    != null) { update.set(b.isNotice,    entity.getIsNotice());    hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(b.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(b.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(b.blogId.eq(entity.getBlogId())).execute();
        return (int) affected;
    }
}
