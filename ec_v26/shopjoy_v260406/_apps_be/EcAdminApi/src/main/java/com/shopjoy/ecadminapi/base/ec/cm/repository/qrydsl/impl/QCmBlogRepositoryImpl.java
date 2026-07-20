package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmBlog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogRepositoryImpl implements QCmBlogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogRepositoryImpl";
    private static final QCmBlog cmBlog = QCmBlog.cmBlog;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", cmBlog.regDate,
        "upd_date", cmBlog.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("blogAuthor", cmBlog.blogAuthor),
        Map.entry("blogCateId", cmBlog.blogCateId),
        Map.entry("blogContent", cmBlog.blogContent),
        Map.entry("blogId", cmBlog.blogId),
        Map.entry("blogSummary", cmBlog.blogSummary),
        Map.entry("blogTitle", cmBlog.blogTitle),
        Map.entry("isNotice", cmBlog.isNotice),
        Map.entry("prodId", cmBlog.prodId),
        Map.entry("siteId", cmBlog.siteId),
        Map.entry("useYn", cmBlog.useYn)
    );

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmBlogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogDto.Item.class,
                        cmBlog.blogId, cmBlog.siteId, cmBlog.blogCateId, cmBlog.blogTypeCd, cmBlog.blogTitle, cmBlog.blogSummary,
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
                QdslUtil.strEq(cmBlog.siteId, search.getSiteId()),
                QdslUtil.strEq(cmBlog.blogId, search.getBlogId()),
                QdslUtil.strEq(cmBlog.blogTypeCd, search.getBlogTypeCd()),
                QdslUtil.strEq(cmBlog.blogCateId, search.getBlogCateId()),
                QdslUtil.strEq(cmBlog.useYn, search.getUseYn()),
                QdslUtil.strEq(cmBlog.isNotice, search.getIsNotice()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public CmBlogDto.PageResponse selectPageData(CmBlogDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(cmBlog.siteId, search.getSiteId()),
                QdslUtil.strEq(cmBlog.blogId, search.getBlogId()),
                QdslUtil.strEq(cmBlog.blogTypeCd, search.getBlogTypeCd()),
                QdslUtil.strEq(cmBlog.blogCateId, search.getBlogCateId()),
                QdslUtil.strEq(cmBlog.useYn, search.getUseYn()),
                QdslUtil.strEq(cmBlog.isNotice, search.getIsNotice()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmBlogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmBlogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlog.count())
                .where(wheres)
                .fetchOne();

        CmBlogDto.PageResponse res = new CmBlogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(CmBlogDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
        if (entity.getBlogTypeCd()  != null) { update.set(cmBlog.blogTypeCd,  entity.getBlogTypeCd());  hasAny = true; }
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
