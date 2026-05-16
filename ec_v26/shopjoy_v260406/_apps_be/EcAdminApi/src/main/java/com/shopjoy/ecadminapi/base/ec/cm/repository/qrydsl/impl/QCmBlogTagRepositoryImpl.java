package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmBlogTag QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogTagRepositoryImpl implements QCmBlogTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final QCmBlogTag t = QCmBlogTag.cmBlogTag;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmBlogTagDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogTagDto.Item.class,
                        t.blogTagId, t.siteId, t.blogId, t.tagNm, t.sortOrd,
                        t.regBy, t.regDate, t.updBy, t.updDate
                ))
                .from(t);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogTagDto.Item> selectById(String blogTagId) {
        CmBlogTagDto.Item dto = buildBaseQuery()
                .where(t.blogTagId.eq(blogTagId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogTagDto.Item> selectList(CmBlogTagDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogTagDto.Item> query = buildBaseQuery().where(where);
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
    public CmBlogTagDto.PageResponse selectPageList(CmBlogTagDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogTagDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogTagDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(t.count())
                .from(t)
                .where(where)
                .fetchOne();

        CmBlogTagDto.PageResponse res = new CmBlogTagDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanBuilder buildCondition(CmBlogTagDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))    w.and(t.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBlogTagId())) w.and(t.blogTagId.eq(s.getBlogTagId()));

        // searchValue + searchType (tagNm)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",tagNm,")) or.or(t.tagNm.likeIgnoreCase(pattern));
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
                    w.and(t.regDate.goe(start)).and(t.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(t.updDate.goe(start)).and(t.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(CmBlogTagDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("blogTagId".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.blogTagId));
                } else if ("tagNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.tagNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.regDate));
                }
            }
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlogTag entity) {
        if (entity.getBlogTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;

        if (entity.getSiteId()  != null) { update.set(t.siteId,  entity.getSiteId());  hasAny = true; }
        if (entity.getBlogId()  != null) { update.set(t.blogId,  entity.getBlogId());  hasAny = true; }
        if (entity.getTagNm()   != null) { update.set(t.tagNm,   entity.getTagNm());   hasAny = true; }
        if (entity.getSortOrd() != null) { update.set(t.sortOrd, entity.getSortOrd()); hasAny = true; }
        if (entity.getUpdBy()   != null) { update.set(t.updBy,   entity.getUpdBy());   hasAny = true; }
        if (entity.getUpdDate() != null) { update.set(t.updDate, entity.getUpdDate()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(t.blogTagId.eq(entity.getBlogTagId())).execute();
        return (int) affected;
    }
}
