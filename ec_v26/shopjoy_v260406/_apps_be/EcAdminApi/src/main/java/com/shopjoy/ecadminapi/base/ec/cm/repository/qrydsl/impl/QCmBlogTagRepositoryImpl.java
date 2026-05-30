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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

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
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogTagDto.Item> query = buildBaseQuery().where(
                andBlogIds(search),
                andBlogId(search),
                andSiteId(search),
                andBlogTagId(search),
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
    public CmBlogTagDto.PageResponse selectPageList(CmBlogTagDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogTagDto.Item> query = buildBaseQuery().where(
                andBlogIds(search),
                andBlogId(search),
                andSiteId(search),
                andBlogTagId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogTagDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(t.count())
                .from(t)
                .where(
                andBlogIds(search),
                andBlogId(search),
                andSiteId(search),
                andBlogTagId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        CmBlogTagDto.PageResponse res = new CmBlogTagDto.PageResponse();
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
    private BooleanExpression andBlogIds(CmBlogTagDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getBlogIds())
                ? t.blogId.in(search.getBlogIds()) : null;
    }

    /* blogId 정확 일치 */
    private BooleanExpression andBlogId(CmBlogTagDto.Request search) {
        return search != null && StringUtils.hasText(search.getBlogId())
                ? t.blogId.eq(search.getBlogId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(CmBlogTagDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? t.siteId.eq(search.getSiteId()) : null;
    }

    /* blogTagId 정확 일치 */
    private BooleanExpression andBlogTagId(CmBlogTagDto.Request search) {
        return search != null && StringUtils.hasText(search.getBlogTagId())
                ? t.blogTagId.eq(search.getBlogTagId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(CmBlogTagDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return t.regDate.goe(start).and(t.regDate.lt(endExcl));
            case "upd_date": return t.updDate.goe(start).and(t.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(CmBlogTagDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",blogId,", t.blogId, pattern);
        or = orLike(or, all, types, ",blogTagId,", t.blogTagId, pattern);
        or = orLike(or, all, types, ",siteId,", t.siteId, pattern);
        or = orLike(or, all, types, ",tagNm,", t.tagNm, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(CmBlogTagDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, t.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.blogTagId));

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
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, t.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, t.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.blogTagId));
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(t.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(t.blogTagId.eq(entity.getBlogTagId())).execute();
        return (int) affected;
    }
}
