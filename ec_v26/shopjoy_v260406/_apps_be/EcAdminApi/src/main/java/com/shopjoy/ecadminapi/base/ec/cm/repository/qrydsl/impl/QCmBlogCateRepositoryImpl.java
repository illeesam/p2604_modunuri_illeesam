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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogCateRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** CmBlogCate QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogCateRepositoryImpl implements QCmBlogCateRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogCateRepositoryImpl";
    private static final QCmBlogCate cmBlogCate = QCmBlogCate.cmBlogCate;
    private static final QSySite sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", cmBlogCate.regDate,
        "upd_date", cmBlogCate.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("blogCateId", cmBlogCate.blogCateId),
        Map.entry("blogCateNm", cmBlogCate.blogCateNm),
        Map.entry("parentBlogCateId", cmBlogCate.parentBlogCateId),
        Map.entry("siteId", cmBlogCate.siteId),
        Map.entry("useYn", cmBlogCate.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값
     * USE_YN  {Y: '사용', N: '미사용'} — sy_code 미등록, use_yn 전역 공통 규약
     */
    private JPAQuery<CmBlogCateDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogCateDto.Item.class,
                        cmBlogCate.blogCateId,       // 블로그카테고리ID (PK)
                        cmBlogCate.siteId,           // 사이트ID (sy_site.site_id)
                        cmBlogCate.blogCateNm,       // 카테고리명
                        cmBlogCate.parentBlogCateId, // 상위 카테고리ID (NULL이면 최상위)
                        cmBlogCate.sortOrd,          // 정렬순서
                        cmBlogCate.useYn,            // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        cmBlogCate.regBy,            // 등록자
                        cmBlogCate.regDate,          // 등록일시
                        cmBlogCate.updBy,            // 수정자
                        cmBlogCate.updDate,          // 수정일시
                        sySite.siteNm.as("siteNm")   // 사이트명 (sy_site 조인)
                ))
                .from(cmBlogCate)
                .leftJoin(sySite).on(sySite.siteId.eq(cmBlogCate.siteId));
    }

    /* 게시판 카테고리 키조회 */
    @Override
    public Optional<CmBlogCateDto.Item> selectById(String blogCateId) {
        CmBlogCateDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogCate.blogCateId.eq(blogCateId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시판 카테고리 목록조회 */
    @Override
    public List<CmBlogCateDto.Item> selectList(CmBlogCateDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogCateDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(cmBlogCate.siteId, search.getSiteId()),
                QdslUtil.strEq(cmBlogCate.blogCateId, search.getBlogCateId()),
                QdslUtil.strEq(cmBlogCate.useYn, search.getUseYn()),
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

    /* 게시판 카테고리 페이지조회 */
    @Override
    public CmBlogCateDto.PageResponse selectPageData(CmBlogCateDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(cmBlogCate.siteId, search.getSiteId()),
                QdslUtil.strEq(cmBlogCate.blogCateId, search.getBlogCateId()),
                QdslUtil.strEq(cmBlogCate.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmBlogCateDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmBlogCateDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogCate.count())
                .where(wheres)
                .fetchOne();

        CmBlogCateDto.PageResponse res = new CmBlogCateDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(CmBlogCateDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmBlogCateDto.Request sySite) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = sySite == null ? null : sySite.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.blogCateId));

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
                    orders.add(new OrderSpecifier(order, cmBlogCate.blogCateId));
                } else if ("blogCateNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogCate.blogCateNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogCate.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, cmBlogCate.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.blogCateId));
        }
        return orders;
    }

    /* 게시판 카테고리 수정 */
    @Override
    public int updateSelective(CmBlogCate entity) {
        if (entity.getBlogCateId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogCate);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(cmBlogCate.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getBlogCateNm()       != null) { update.set(cmBlogCate.blogCateNm,       entity.getBlogCateNm());       hasAny = true; }
        if (entity.getParentBlogCateId() != null) { update.set(cmBlogCate.parentBlogCateId, entity.getParentBlogCateId()); hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(cmBlogCate.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(cmBlogCate.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(cmBlogCate.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmBlogCate.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlogCate.blogCateId.eq(entity.getBlogCateId())).execute();
        return (int) affected;
    }
}
