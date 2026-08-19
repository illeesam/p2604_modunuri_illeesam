package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdCategoryProd(상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdCategoryProdRepositoryImpl implements QPdCategoryProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdCategoryProdRepositoryImpl";
    private static final QPdCategoryProd pdCategoryProd   = QPdCategoryProd.pdCategoryProd;
    private static final QSySite         sySite = QSySite.sySite;
    private static final QPdCategory     pdCategory = QPdCategory.pdCategory;
    private static final QPdProd         pdProd = QPdProd.pdProd;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CATEGORY_PROD_TYPE_CD  {NORMAL: '일반', HIGHLIGHT: '강조', RECOMMEND: '추천', MAIN: '메인', BANNER: '배너', HOT_DEAL: '핫딜'}
     * DISP_YN                {Y: '전시', N: '비전시'}
     */
    private JPAQuery<PdCategoryProdDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdCategoryProdDto.Item.class,
                        pdCategoryProd.categoryProdId,        // 상품카테고리연결ID (PK, YYMMDDhhmmss+rand4)
                        pdCategoryProd.categoryId,             // 카테고리ID (pd_category.category_id)
                        pdCategoryProd.prodId,                 // 상품ID (pd_prod.prod_id)
                        pdCategoryProd.categoryProdTypeCd,     // 진열유형 — {NORMAL: '일반', HIGHLIGHT: '강조', RECOMMEND: '추천', MAIN: '메인', BANNER: '배너', HOT_DEAL: '핫딜'}
                        pdCategoryProd.sortOrd,                // 표시 순서 (동일 타입 내, 낮을수록 우선 노출)
                        pdCategoryProd.emphasisCd,             // 강조표시 코드
                        pdCategoryProd.dispYn,                  // 전시여부 — {Y: '전시', N: '비전시'}
                        pdCategoryProd.dispStartDate,           // 전시시작일 (NULL=즉시)
                        pdCategoryProd.dispEndDate,             // 전시종료일 (NULL=무기한)
                        pdCategoryProd.regBy, pdCategoryProd.regDate, pdCategoryProd.updBy, pdCategoryProd.updDate,
                        pdCategory.categoryNm.as("categoryNm"),        // 카테고리명 (조인)
                        pdProd.prodNm.as("prodNm")                     // 상품명 (조인)
                ))
                .from(pdCategoryProd)
                .innerJoin(pdCategory).on(pdCategory.categoryId.eq(pdCategoryProd.categoryId)) // 카테고리
                .innerJoin(pdProd).on(pdProd.prodId.eq(pdCategoryProd.prodId)) // 상품
                ;
    }

    /* 카테고리-상품 매핑 키조회 */
    @Override
    public Optional<PdCategoryProdDto.Item> selectById(String categoryProdId) {
        PdCategoryProdDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdCategoryProd.categoryProdId.eq(categoryProdId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 카테고리-상품 매핑 목록조회 */
    @Override
    public List<PdCategoryProdDto.Item> selectList(PdCategoryProdDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdCategoryProd.categoryProdId, search.getCategoryProdId()));
        whereList.add(QdslUtil.strEq(pdCategoryProd.categoryId, search.getCategoryId()));
        whereList.add(andCategoryIdsCsvIn(search));
        whereList.add(QdslUtil.strEq(pdCategoryProd.prodId, search.getProdId()));
        whereList.add(andProdNmLike(search));
        whereList.add(QdslUtil.strEq(pdCategoryProd.categoryProdTypeCd, search.getTypeCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdCategoryProd.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdCategoryProd.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdCategoryProdDto.Item> query = baseSelColumnQuery()
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
        List<PdCategoryProdDto.Item> list = query.fetch();
        return list;
    }

    /* 카테고리-상품 매핑 페이지조회 */
    @Override
    public BasePage<PdCategoryProdDto.Item> selectPageData(PdCategoryProdDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdCategoryProd.categoryProdId, search.getCategoryProdId()));
        whereList.add(QdslUtil.strEq(pdCategoryProd.categoryId, search.getCategoryId()));
        whereList.add(andCategoryIdsCsvIn(search));
        whereList.add(QdslUtil.strEq(pdCategoryProd.prodId, search.getProdId()));
        whereList.add(andProdNmLike(search));
        whereList.add(QdslUtil.strEq(pdCategoryProd.categoryProdTypeCd, search.getTypeCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdCategoryProd.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdCategoryProd.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdCategoryProdDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdCategoryProdDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdCategoryProd.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdCategoryProdDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

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

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("categoryId", pdCategoryProd.categoryId),
            QdslUtil.FieldDef.like("categoryProdId", pdCategoryProd.categoryProdId),
            QdslUtil.FieldDef.like("categoryProdTypeCd", pdCategoryProd.categoryProdTypeCd),
            QdslUtil.FieldDef.like("dispYn", pdCategoryProd.dispYn),
            QdslUtil.FieldDef.like("emphasisCd", pdCategoryProd.emphasisCd),
            QdslUtil.FieldDef.like("prodId", pdCategoryProd.prodId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("categoryProdId", pdCategoryProd.categoryProdId,
                   "regDate", pdCategoryProd.regDate,
                   "sortOrd", pdCategoryProd.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdCategoryProd.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdCategoryProd.regDate),
        new OrderSpecifier<>(Order.ASC, pdCategoryProd.categoryProdId));
    }

    /* 카테고리-상품 매핑 수정 */
    @Override
    public int updateSelective(PdCategoryProd entity) {
        if (entity.getCategoryProdId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdCategoryProd);
        boolean hasAny = false;

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
