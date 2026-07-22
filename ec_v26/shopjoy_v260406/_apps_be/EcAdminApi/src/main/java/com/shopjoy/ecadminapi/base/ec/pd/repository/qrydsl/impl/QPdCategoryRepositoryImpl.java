package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdCategoryRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdCategory QueryDSL Custom 구현체 */
public class QPdCategoryRepositoryImpl implements QPdCategoryRepository {

    private final JPAQueryFactory queryFactory;
    private final PdCategoryRepository pdCategoryRepository;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdCategoryRepositoryImpl";
    private static final QPdCategory pdCategory   = QPdCategory.pdCategory;

    public QPdCategoryRepositoryImpl(JPAQueryFactory queryFactory, @Lazy PdCategoryRepository pdCategoryRepository) {
        this.queryFactory = queryFactory;
        this.pdCategoryRepository = pdCategoryRepository;
    }
    private static final QPdCategory p1  = new QPdCategory("p1");
    private static final QPdCategory p2  = new QPdCategory("p2");
    private static final QSyCode     cdCs = new QSyCode("cd_cs");
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("categoryDesc", pdCategory.categoryDesc),
        Map.entry("categoryId", pdCategory.categoryId),
        Map.entry("categoryNm", pdCategory.categoryNm),
        Map.entry("categoryStatusCd", pdCategory.categoryStatusCd),
        Map.entry("categoryStatusCdBefore", pdCategory.categoryStatusCdBefore),
        Map.entry("imgUrl", pdCategory.imgUrl),
        Map.entry("parentCategoryId", pdCategory.parentCategoryId),
        Map.entry("siteId", pdCategory.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CATEGORY_STATUS_CD (코드: USE_YN)  {Y: '사용', N: '미사용'}
     * CATEGORY_DEPTH                     {1: '대분류', 2: '중분류', 3: '소분류'}
     */
    private JPAQuery<PdCategoryDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdCategoryDto.Item.class,
                        pdCategory.categoryId,                 // 카테고리ID (PK, YYMMDDhhmmss+rand4)
                        pdCategory.siteId,                     // 사이트ID (sy_site.site_id)
                        pdCategory.parentCategoryId,           // 상위 카테고리ID
                        pdCategory.categoryNm,                 // 카테고리명
                        pdCategory.categoryDepth,               // 깊이 — {1: '대분류', 2: '중분류', 3: '소분류'}
                        pdCategory.sortOrd,                     // 정렬순서
                        pdCategory.categoryStatusCd,             // 상태 — USE_YN {Y: '사용', N: '미사용'}
                        pdCategory.categoryStatusCdBefore,       // 변경 전 카테고리상태 — USE_YN {Y: '사용', N: '미사용'}
                        pdCategory.imgUrl,                     // 이미지URL
                        pdCategory.categoryDesc,                // 설명
                        pdCategory.regBy, pdCategory.regDate, pdCategory.updBy, pdCategory.updDate,
                        p1.categoryNm.as("parentCategoryNm"),           // 상위 카테고리명 (조인)
                        p2.categoryNm.as("grandParentCategoryNm"),      // 최상위(조부모) 카테고리명 (조인)
                        cdCs.codeLabel.as("categoryStatusCdNm")         // 카테고리상태 코드라벨 (조인, sy_code.USE_YN)
                ))
                .from(pdCategory)
                .leftJoin(p1).on(p1.categoryId.eq(pdCategory.parentCategoryId))
                .leftJoin(p2).on(p2.categoryId.eq(p1.parentCategoryId))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("USE_YN").and(cdCs.codeValue.eq(pdCategory.categoryStatusCd)));
    }

    /* 상품 카테고리 키조회 */
    @Override
    public Optional<PdCategoryDto.Item> selectById(String categoryId) {
        PdCategoryDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdCategory.categoryId.eq(categoryId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 카테고리 목록조회 */
    @Override
    public List<PdCategoryDto.Item> selectList(PdCategoryDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pdCategory.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdCategory.categoryId, search.getCategoryId()),
                    andParentCategoryIdIn(search),
                    QdslUtil.strEq(pdCategory.categoryStatusCd, search.getStatus()),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 상품 카테고리 페이지조회 */
    @Override
    public PdCategoryDto.PageResponse selectPageData(PdCategoryDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdCategory.siteId, search.getSiteId()),
                QdslUtil.strEq(pdCategory.categoryId, search.getCategoryId()),
                andParentCategoryIdIn(search),
                QdslUtil.strEq(pdCategory.categoryStatusCd, search.getStatus()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdCategoryDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdCategoryDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdCategory.count())
                .where(wheres)
                .fetchOne();

        PdCategoryDto.PageResponse res = new PdCategoryDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* 카테고리 트리 — 선택 노드 + 모든 자손 카테고리 포함 */
    private BooleanExpression andParentCategoryIdIn(PdCategoryDto.Request search) {
        return search != null && StringUtils.hasText(search.getParentCategoryId())
                ? pdCategory.categoryId.in(pdCategoryRepository.findTreeCategoryIds(search.getParentCategoryId()))
                : null;
    }

    private BooleanExpression andSearchValueLike(PdCategoryDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdCategoryDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, pdCategory.categoryDepth));
            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategory.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategory.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategory.categoryId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("categoryId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdCategory.categoryId));
                } else if ("categoryNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdCategory.categoryNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdCategory.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pdCategory.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategory.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategory.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategory.categoryId));
        }
        return orders;
    }

    /* 상품 카테고리 수정 */

    @Override
    public int updateSelective(PdCategory entity) {
        if (entity.getCategoryId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdCategory);
        boolean hasAny = false;

        if (entity.getCategoryNm()             != null) { update.set(pdCategory.categoryNm,             entity.getCategoryNm());             hasAny = true; }
        if (entity.getCategoryStatusCd()       != null) { update.set(pdCategory.categoryStatusCd,       entity.getCategoryStatusCd());       hasAny = true; }
        if (entity.getCategoryStatusCdBefore() != null) { update.set(pdCategory.categoryStatusCdBefore, entity.getCategoryStatusCdBefore()); hasAny = true; }
        if (entity.getSortOrd()                != null) { update.set(pdCategory.sortOrd,                entity.getSortOrd());                hasAny = true; }
        if (entity.getImgUrl()                 != null) { update.set(pdCategory.imgUrl,                 entity.getImgUrl());                 hasAny = true; }
        if (entity.getCategoryDesc()           != null) { update.set(pdCategory.categoryDesc,           entity.getCategoryDesc());           hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(pdCategory.updBy,                  entity.getUpdBy());                  hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdCategory.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdCategory.categoryId.eq(entity.getCategoryId())).execute();
        return (int) affected;
    }
}
