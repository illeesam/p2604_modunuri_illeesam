package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogCateRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmBlogCate QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogCateRepositoryImpl implements QCmBlogCateRepository {

    private final JPAQueryFactory queryFactory;
    private static final QCmBlogCate c = QCmBlogCate.cmBlogCate;
    private static final QSySite s = QSySite.sySite;

    private JPAQuery<CmBlogCateDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogCateDto.Item.class,
                        c.blogCateId, c.siteId, c.blogCateNm, c.parentBlogCateId,
                        c.sortOrd, c.useYn,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        s.siteNm.as("siteNm")
                ))
                .from(c)
                .leftJoin(s).on(s.siteId.eq(c.siteId));
    }

    @Override
    public Optional<CmBlogCateDto.Item> selectById(String blogCateId) {
        CmBlogCateDto.Item dto = buildBaseQuery()
                .where(c.blogCateId.eq(blogCateId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<CmBlogCateDto.Item> selectList(CmBlogCateDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogCateDto.Item> query = buildBaseQuery().where(where);
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

    @Override
    public CmBlogCateDto.PageResponse selectPageList(CmBlogCateDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogCateDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogCateDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .where(where)
                .fetchOne();

        CmBlogCateDto.PageResponse res = new CmBlogCateDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(CmBlogCateDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBlogCateId())) w.and(c.blogCateId.eq(s.getBlogCateId()));
        if (StringUtils.hasText(s.getUseYn()))      w.and(c.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_blog_cate_nm")) or.or(c.blogCateNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
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
    private List<OrderSpecifier<?>> buildOrder(CmBlogCateDto.Request s) {
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
                if ("blogCateId".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.blogCateId));
                } else if ("blogCateNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.blogCateNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(CmBlogCate entity) {
        if (entity.getBlogCateId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(c.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getBlogCateNm()       != null) { update.set(c.blogCateNm,       entity.getBlogCateNm());       hasAny = true; }
        if (entity.getParentBlogCateId() != null) { update.set(c.parentBlogCateId, entity.getParentBlogCateId()); hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(c.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(c.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(c.updBy,            entity.getUpdBy());            hasAny = true; }
        if (entity.getUpdDate()          != null) { update.set(c.updDate,          entity.getUpdDate());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.blogCateId.eq(entity.getBlogCateId())).execute();
        return (int) affected;
    }
}
