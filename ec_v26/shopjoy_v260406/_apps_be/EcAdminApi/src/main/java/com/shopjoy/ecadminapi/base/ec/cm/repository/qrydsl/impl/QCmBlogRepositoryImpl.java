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
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogRepositoryImpl";
    private static final QCmBlog cmBlog = QCmBlog.cmBlog;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmBlogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogDto.Item.class,
                        cmBlog.blogId, cmBlog.siteId, cmBlog.blogCateId, cmBlog.blogTitle, cmBlog.blogSummary,
                        cmBlog.blogContent, cmBlog.blogAuthor, cmBlog.prodId, cmBlog.viewCount,
                        cmBlog.useYn, cmBlog.isNotice,
                        cmBlog.regBy, cmBlog.regDate, cmBlog.updBy, cmBlog.updDate
                ))
                .from(cmBlog);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogDto.Item> selectById(String blogId) {
        CmBlogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlog.blogId.eq(blogId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<CmBlogDto.Item> selectList(CmBlogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndBlogId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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
    public CmBlogDto.PageResponse selectPageData(CmBlogDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(
                baseAndSiteId(search),
                baseAndBlogId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(cmBlog.count())
                .from(cmBlog)
                .where(
                baseAndSiteId(search),
                baseAndBlogId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        CmBlogDto.PageResponse res = new CmBlogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(CmBlogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? cmBlog.siteId.eq(search.getSiteId()) : null;
    }

    /* blogId 정확 일치 */
    private BooleanExpression baseAndBlogId(CmBlogDto.Request search) {
        return search != null && StringUtils.hasText(search.getBlogId())
                ? cmBlog.blogId.eq(search.getBlogId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(CmBlogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? cmBlog.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(CmBlogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return cmBlog.regDate.goe(start).and(cmBlog.regDate.lt(endExcl));
            case "upd_date": return cmBlog.updDate.goe(start).and(cmBlog.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(CmBlogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",blogAuthor,", cmBlog.blogAuthor, pattern);
        or = orLike(or, all, types, ",blogCateId,", cmBlog.blogCateId, pattern);
        or = orLike(or, all, types, ",blogContent,", cmBlog.blogContent, pattern);
        or = orLike(or, all, types, ",blogId,", cmBlog.blogId, pattern);
        or = orLike(or, all, types, ",blogSummary,", cmBlog.blogSummary, pattern);
        or = orLike(or, all, types, ",blogTitle,", cmBlog.blogTitle, pattern);
        or = orLike(or, all, types, ",isNotice,", cmBlog.isNotice, pattern);
        or = orLike(or, all, types, ",prodId,", cmBlog.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", cmBlog.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", cmBlog.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(CmBlogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, cmBlog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlog.blogId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("blogId".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlog.blogId));
                } else if ("blogTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlog.blogTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlog.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, cmBlog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlog.blogId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlog entity) {
        if (entity.getBlogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlog);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(cmBlog.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getBlogCateId()  != null) { update.set(cmBlog.blogCateId,  entity.getBlogCateId());  hasAny = true; }
        if (entity.getBlogTitle()   != null) { update.set(cmBlog.blogTitle,   entity.getBlogTitle());   hasAny = true; }
        if (entity.getBlogSummary() != null) { update.set(cmBlog.blogSummary, entity.getBlogSummary()); hasAny = true; }
        if (entity.getBlogContent() != null) { update.set(cmBlog.blogContent, entity.getBlogContent()); hasAny = true; }
        if (entity.getBlogAuthor()  != null) { update.set(cmBlog.blogAuthor,  entity.getBlogAuthor());  hasAny = true; }
        if (entity.getProdId()      != null) { update.set(cmBlog.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getViewCount()   != null) { update.set(cmBlog.viewCount,   entity.getViewCount());   hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(cmBlog.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getIsNotice()    != null) { update.set(cmBlog.isNotice,    entity.getIsNotice());    hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(cmBlog.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmBlog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlog.blogId.eq(entity.getBlogId())).execute();
        return (int) affected;
    }
}
