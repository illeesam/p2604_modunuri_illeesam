package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdCategoryRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** PdCategory(카테고리) QueryDSL Custom 구현체 */
public class QPdCategoryRepositoryImpl implements QPdCategoryRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdCategoryRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdCategory pdCategory   = QPdCategory.pdCategory;

    public QPdCategoryRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }
    private static final QPdCategory p1  = new QPdCategory("p1");
    private static final QPdCategory p2  = new QPdCategory("p2");
    private static final QVwSyCode     codeCategoryStatusCd = new QVwSyCode("cd_cs");

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CATEGORY_STATUS_CD (코드: USE_YN)  {Y: '사용', N: '미사용'}
     * CATEGORY_DEPTH                     {1: '대분류', 2: '중분류', 3: '소분류'}
     */
    private JPAQuery<PdCategoryDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdCategoryDto.Item.class,
                        pdCategory.categoryId,                 // 카테고리ID (PK, YYMMDDhhmmss+rand4)
                        pdCategory.parentCategoryId,           // 상위 카테고리ID
                        pdCategory.categoryNm,                 // 카테고리명
                        pdCategory.categoryDepth,               // 깊이 — {1: '대분류', 2: '중분류', 3: '소분류'}
                        pdCategory.sortOrd,                     // 정렬순서
                        pdCategory.categoryStatusCd,             // 상태 — USE_YN {Y: '사용', N: '미사용'}
                        pdCategory.categoryStatusCdBefore,       // 변경 전 카테고리상태 — USE_YN {Y: '사용', N: '미사용'}
                        pdCategory.imgUrl,                     // 이미지URL
                        pdCategory.categoryDesc,                // 설명
                        pdCategory.regBy,      // 등록자
                        pdCategory.regDate,    // 등록일시
                        pdCategory.updBy,      // 수정자
                        pdCategory.updDate,    // 수정일시
                        p1.categoryNm.as("parentCategoryNm"),           // 상위 카테고리명 (조인)
                        p2.categoryNm.as("grandParentCategoryNm"),      // 최상위(조부모) 카테고리명 (조인)
                        codeCategoryStatusCd.codeLabel.as("categoryStatusCdNm"),         // 카테고리상태 코드라벨 (조인, sy_code.USE_YN)
                        pdCategory.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdCategory.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdCategory)
                .leftJoin(p1).on(p1.categoryId.eq(pdCategory.parentCategoryId)) // 카테고리
                .leftJoin(p2).on(p2.categoryId.eq(p1.parentCategoryId)) // 카테고리
                .leftJoin(codeCategoryStatusCd).on(codeCategoryStatusCd.codeGrp.eq("USE_YN").and(codeCategoryStatusCd.codeValue.eq(pdCategory.categoryStatusCd))) // 사용여부
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdCategory.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdCategory.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdCategory.siteId)) // 사이트

                ;
    }

    /* 상품 카테고리 키조회 */
    @Override
    public Optional<PdCategoryDto.Item> selectById(String categoryId) {
        PdCategoryDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdCategory.categoryId.eq(categoryId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 상품 카테고리 목록조회 */
    @Override
    public List<PdCategoryDto.Item> selectList(PdCategoryDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdCategory.categoryId, search.getCategoryId())); // 카테고리ID 필터
        whereList.add(andParentCategoryIdIn(search));
        whereList.add(QdslUtil.strEq(pdCategory.categoryStatusCd, search.getStatus())); // 카테고리상태 필터 — CATEGORY_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdCategory.siteId, search.getSiteId())); // 사이트ID 필터

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdCategoryDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PdCategoryDto.Item> list = query.fetch();
        return list;
    }

    /* 상품 카테고리 페이지조회 */
    @Override
    public BasePage<PdCategoryDto.Item> selectPageData(PdCategoryDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdCategory.categoryId, search.getCategoryId())); // 카테고리ID 필터
        whereList.add(andParentCategoryIdIn(search));
        whereList.add(QdslUtil.strEq(pdCategory.categoryStatusCd, search.getStatus())); // 카테고리상태 필터 — CATEGORY_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdCategory.siteId, search.getSiteId())); // 사이트ID 필터

        JPAQuery<PdCategoryDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdCategoryDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdCategory.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdCategoryDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    /* 카테고리 트리 — 선택 노드 + 모든 자손 카테고리 포함 */
    private BooleanExpression andParentCategoryIdIn(PdCategoryDto.Request search) {
        return search != null && StringUtils.hasText(search.getParentCategoryId())
                // [QueryDSL] 카테고리 트리 자손ID 수집
                ? pdCategory.categoryId.in(selectTreeCategoryIds(search.getParentCategoryId()))
                : null;
    }

    /** 루트 category + 모든 자손 category_id 수집 — 전체 (categoryId, parentCategoryId) 를 한 번에 읽어 자바에서 BFS */
    @Override
    public List<String> selectTreeCategoryIds(String rootCategoryId) {
        List<com.querydsl.core.Tuple> rows = queryFactory.select(pdCategory.categoryId, pdCategory.parentCategoryId)
                .from(pdCategory)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectTreeCategoryIds()")
                .fetch();

        Map<String, List<String>> childrenOf = new java.util.HashMap<>();
        for (com.querydsl.core.Tuple row : rows) {
            String parentId = row.get(pdCategory.parentCategoryId);
            if (parentId != null) {
                childrenOf.computeIfAbsent(parentId, k -> new ArrayList<>()).add(row.get(pdCategory.categoryId));
            }
        }
        return QdslUtil.collectTreeIds(rootCategoryId, childrenOf);
    }

    /* searchType 예: "categoryDesc,categoryId,categoryNm,categoryStatusCd,categoryStatusCdBefore" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("categoryDesc", pdCategory.categoryDesc), // 설명
            QdslUtil.FieldDef.like("categoryId", pdCategory.categoryId), // 카테고리ID 필터
            QdslUtil.FieldDef.like("categoryNm", pdCategory.categoryNm), // 카테고리명
            QdslUtil.FieldDef.like("categoryStatusCd", pdCategory.categoryStatusCd), // 상태 — CATEGORY_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
            QdslUtil.FieldDef.like("categoryStatusCdBefore", pdCategory.categoryStatusCdBefore), // 변경 전 카테고리상태 — CATEGORY_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
            QdslUtil.FieldDef.like("imgUrl", pdCategory.imgUrl), // 이미지URL
            QdslUtil.FieldDef.like("parentCategoryId", pdCategory.parentCategoryId) // 상위 카테고리ID 필터
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("categoryId", pdCategory.categoryId,
                   "categoryNm", pdCategory.categoryNm,
                   "regDate", pdCategory.regDate,
                   "sortOrd", pdCategory.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdCategory.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdCategory.regDate),
        new OrderSpecifier<>(Order.ASC, pdCategory.categoryId));
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
        update.set(pdCategory.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdCategory.categoryId.eq(entity.getCategoryId())).execute();
        return (int) affected;
    }
}
