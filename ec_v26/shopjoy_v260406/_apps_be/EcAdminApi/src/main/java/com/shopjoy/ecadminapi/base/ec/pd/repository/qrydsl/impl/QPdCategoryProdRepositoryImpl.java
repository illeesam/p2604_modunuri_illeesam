package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdCategoryProdRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdCategoryProd QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdCategoryProdRepositoryImpl implements QPdCategoryProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdCategoryProdRepositoryImpl";
    private static final QPdCategoryProd pdCategoryProd   = QPdCategoryProd.pdCategoryProd;
    private static final QSySite         sySite = QSySite.sySite;
    private static final QPdCategory     pdCategory = QPdCategory.pdCategory;
    private static final QPdProd         pdProd = QPdProd.pdProd;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdCategoryProd.regDate,
        "upd_date", pdCategoryProd.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("categoryId", pdCategoryProd.categoryId),
        Map.entry("categoryProdId", pdCategoryProd.categoryProdId),
        Map.entry("categoryProdTypeCd", pdCategoryProd.categoryProdTypeCd),
        Map.entry("dispYn", pdCategoryProd.dispYn),
        Map.entry("emphasisCd", pdCategoryProd.emphasisCd),
        Map.entry("prodId", pdCategoryProd.prodId),
        Map.entry("siteId", pdCategoryProd.siteId)
    );

    /* 카테고리-상품 매핑 baseSelColumnQuery */
    private JPAQuery<PdCategoryProdDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdCategoryProdDto.Item.class,
                        pdCategoryProd.categoryProdId, pdCategoryProd.siteId, pdCategoryProd.categoryId, pdCategoryProd.prodId,
                        pdCategoryProd.categoryProdTypeCd, pdCategoryProd.sortOrd, pdCategoryProd.emphasisCd,
                        pdCategoryProd.dispYn, pdCategoryProd.dispStartDate, pdCategoryProd.dispEndDate,
                        pdCategoryProd.regBy, pdCategoryProd.regDate, pdCategoryProd.updBy, pdCategoryProd.updDate,
                        sySite.siteNm.as("siteNm"),
                        pdCategory.categoryNm.as("categoryNm"),
                        pdProd.prodNm.as("prodNm")
                ))
                .from(pdCategoryProd)
                .leftJoin(sySite).on(sySite.siteId.eq(pdCategoryProd.siteId))
                .leftJoin(pdCategory).on(pdCategory.categoryId.eq(pdCategoryProd.categoryId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdCategoryProd.prodId));
    }

    /* 카테고리-상품 매핑 키조회 */
    @Override
    public Optional<PdCategoryProdDto.Item> selectById(String categoryProdId) {
        PdCategoryProdDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdCategoryProd.categoryProdId.eq(categoryProdId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 카테고리-상품 매핑 목록조회 */
    @Override
    public List<PdCategoryProdDto.Item> selectList(PdCategoryProdDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryProdDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pdCategoryProd.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdCategoryProd.categoryProdId, search.getCategoryProdId()),
                    QdslUtil.strEq(pdCategoryProd.categoryId, search.getCategoryId()),
                    andCategoryIdsCsvIn(search),
                    QdslUtil.strEq(pdCategoryProd.prodId, search.getProdId()),
                    andProdNmLike(search),
                    QdslUtil.strEq(pdCategoryProd.categoryProdTypeCd, search.getTypeCd()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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

    /* 카테고리-상품 매핑 페이지조회 */
    @Override
    public PdCategoryProdDto.PageResponse selectPageData(PdCategoryProdDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdCategoryProd.siteId, search.getSiteId()),
                QdslUtil.strEq(pdCategoryProd.categoryProdId, search.getCategoryProdId()),
                QdslUtil.strEq(pdCategoryProd.categoryId, search.getCategoryId()),
                andCategoryIdsCsvIn(search),
                QdslUtil.strEq(pdCategoryProd.prodId, search.getProdId()),
                andProdNmLike(search),
                QdslUtil.strEq(pdCategoryProd.categoryProdTypeCd, search.getTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdCategoryProdDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdCategoryProdDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdCategoryProd.count())
                .where(wheres)
                .fetchOne();

        PdCategoryProdDto.PageResponse res = new PdCategoryProdDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* prodNm — 조인된 pd_prod.prodNm LIKE (상품명 검색, 대소문자 무시) */
    private BooleanExpression andProdNmLike(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdNm())
                ? pdProd.prodNm.likeIgnoreCase("%" + search.getProdNm() + "%") : null;
    }

    /* categoryIdsCsv — 콤마 구분 ID 목록 IN 조건 (지정 시 categoryId 단일 대신 우선 적용) */
    private BooleanExpression andCategoryIdsCsvIn(PdCategoryProdDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getCategoryIdsCsv())) return null;
        List<String> ids = Arrays.stream(search.getCategoryIdsCsv().split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
        return ids.isEmpty() ? null : pdCategoryProd.categoryId.in(ids);
    }

private BooleanExpression andSearchValueLike(PdCategoryProdDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdCategoryProdDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategoryProd.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategoryProd.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategoryProd.categoryProdId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("categoryProdId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdCategoryProd.categoryProdId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdCategoryProd.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pdCategoryProd.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategoryProd.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategoryProd.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdCategoryProd.categoryProdId));
        }
        return orders;
    }

    /* 카테고리-상품 매핑 수정 */

    @Override
    public int updateSelective(PdCategoryProd entity) {
        if (entity.getCategoryProdId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdCategoryProd);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(pdCategoryProd.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getCategoryId()         != null) { update.set(pdCategoryProd.categoryId,         entity.getCategoryId());         hasAny = true; }
        if (entity.getProdId()             != null) { update.set(pdCategoryProd.prodId,             entity.getProdId());             hasAny = true; }
        if (entity.getCategoryProdTypeCd() != null) { update.set(pdCategoryProd.categoryProdTypeCd, entity.getCategoryProdTypeCd()); hasAny = true; }
        if (entity.getSortOrd()            != null) { update.set(pdCategoryProd.sortOrd,            entity.getSortOrd());            hasAny = true; }
        if (entity.getEmphasisCd()         != null) { update.set(pdCategoryProd.emphasisCd,         entity.getEmphasisCd());         hasAny = true; }
        if (entity.getDispYn()             != null) { update.set(pdCategoryProd.dispYn,             entity.getDispYn());             hasAny = true; }
        if (entity.getDispStartDate()      != null) { update.set(pdCategoryProd.dispStartDate,      entity.getDispStartDate());      hasAny = true; }
        if (entity.getDispEndDate()        != null) { update.set(pdCategoryProd.dispEndDate,        entity.getDispEndDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pdCategoryProd.categoryProdId.eq(entity.getCategoryProdId())).execute();
        return (int) affected;
    }
}
