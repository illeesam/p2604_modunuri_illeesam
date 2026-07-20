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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmBlogTag QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogTagRepositoryImpl implements QCmBlogTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogTagRepositoryImpl";
    private static final QCmBlogTag cmBlogTag = QCmBlogTag.cmBlogTag;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", cmBlogTag.regDate,
        "upd_date", cmBlogTag.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("blogId", cmBlogTag.blogId),
        Map.entry("blogTagId", cmBlogTag.blogTagId),
        Map.entry("siteId", cmBlogTag.siteId),
        Map.entry("tagNm", cmBlogTag.tagNm)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 없음 (cm_blog_tag 는 블로그-태그명 매핑 테이블)
     */
    private JPAQuery<CmBlogTagDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogTagDto.Item.class,
                        cmBlogTag.blogTagId,  // 태그ID (PK)
                        cmBlogTag.siteId,     // 사이트ID
                        cmBlogTag.blogId,     // 블로그ID (cm_blog.blog_id)
                        cmBlogTag.tagNm,      // 태그명
                        cmBlogTag.sortOrd,    // 정렬순서
                        cmBlogTag.regBy,      // 등록자
                        cmBlogTag.regDate,    // 등록일시
                        cmBlogTag.updBy,      // 수정자
                        cmBlogTag.updDate     // 수정일시
                ))
                .from(cmBlogTag);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogTagDto.Item> selectById(String blogTagId) {
        CmBlogTagDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogTag.blogTagId.eq(blogTagId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogTagDto.Item> selectList(CmBlogTagDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogTagDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strIn(cmBlogTag.blogId, search.getBlogIds()),
                QdslUtil.strEq(cmBlogTag.blogId, search.getBlogId()),
                QdslUtil.strEq(cmBlogTag.siteId, search.getSiteId()),
                QdslUtil.strEq(cmBlogTag.blogTagId, search.getBlogTagId()),
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
    public CmBlogTagDto.PageResponse selectPageData(CmBlogTagDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(cmBlogTag.blogId, search.getBlogIds()),
                QdslUtil.strEq(cmBlogTag.blogId, search.getBlogId()),
                QdslUtil.strEq(cmBlogTag.siteId, search.getSiteId()),
                QdslUtil.strEq(cmBlogTag.blogTagId, search.getBlogTagId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmBlogTagDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmBlogTagDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogTag.count())
                .where(wheres)
                .fetchOne();

        CmBlogTagDto.PageResponse res = new CmBlogTagDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(CmBlogTagDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogTag.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogTag.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogTag.blogTagId));

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
                    orders.add(new OrderSpecifier(order, cmBlogTag.blogTagId));
                } else if ("tagNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogTag.tagNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogTag.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, cmBlogTag.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogTag.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogTag.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogTag.blogTagId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlogTag entity) {
        if (entity.getBlogTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogTag);
        boolean hasAny = false;

        if (entity.getSiteId()  != null) { update.set(cmBlogTag.siteId,  entity.getSiteId());  hasAny = true; }
        if (entity.getBlogId()  != null) { update.set(cmBlogTag.blogId,  entity.getBlogId());  hasAny = true; }
        if (entity.getTagNm()   != null) { update.set(cmBlogTag.tagNm,   entity.getTagNm());   hasAny = true; }
        if (entity.getSortOrd() != null) { update.set(cmBlogTag.sortOrd, entity.getSortOrd()); hasAny = true; }
        if (entity.getUpdBy()   != null) { update.set(cmBlogTag.updBy,   entity.getUpdBy());   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmBlogTag.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlogTag.blogTagId.eq(entity.getBlogTagId())).execute();
        return (int) affected;
    }
}
