package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
/** PdCategoryProd QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdCategoryProdRepositoryImpl implements QPdCategoryProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdCategoryProdRepositoryImpl";
    private static final QPdCategoryProd pdCategoryProd   = QPdCategoryProd.pdCategoryProd;
    private static final QSySite         sySite = QSySite.sySite;
    private static final QPdCategory     pdCategory = QPdCategory.pdCategory;
    private static final QPdProd         pdProd = QPdProd.pdProd;

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
                .where(pdCategoryProd.categoryProdId.eq(categoryProdId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 카테고리-상품 매핑 목록조회 */
    @Override
    public List<PdCategoryProdDto.Item> selectList(PdCategoryProdDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryProdDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndCategoryProdId(search),
                baseAndCategoryId(search),
                baseAndCategoryIdsCsv(search),
                baseAndProdId(search),
                baseAndTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 카테고리-상품 매핑 페이지조회 */
    @Override
    public PdCategoryProdDto.PageResponse selectPageData(PdCategoryProdDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndCategoryProdId(search),
                baseAndCategoryId(search),
                baseAndCategoryIdsCsv(search),
                baseAndProdId(search),
                baseAndTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PdCategoryProdDto.Item> query = baseSelColumnQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdCategoryProdDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(pdCategoryProd.count()).from(pdCategoryProd).where(wheres).fetchOne();

        PdCategoryProdDto.PageResponse res = new PdCategoryProdDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 카테고리-상품 매핑 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdCategoryProd.siteId.eq(search.getSiteId()) : null;
    }

    /* categoryProdId 정확 일치 */
    private BooleanExpression baseAndCategoryProdId(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getCategoryProdId())
                ? pdCategoryProd.categoryProdId.eq(search.getCategoryProdId()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression baseAndProdId(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? pdCategoryProd.prodId.eq(search.getProdId()) : null;
    }

    /* categoryId 정확 일치 */
    private BooleanExpression baseAndCategoryId(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getCategoryId())
                ? pdCategoryProd.categoryId.eq(search.getCategoryId()) : null;
    }

    /* categoryIdsCsv — 콤마 구분 ID 목록 IN 조건 (지정 시 categoryId 단일 대신 우선 적용) */
    private BooleanExpression baseAndCategoryIdsCsv(PdCategoryProdDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getCategoryIdsCsv())) return null;
        List<String> ids = Arrays.stream(search.getCategoryIdsCsv().split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
        return ids.isEmpty() ? null : pdCategoryProd.categoryId.in(ids);
    }

    /* categoryProdTypeCd 정확 일치 */
    private BooleanExpression baseAndTypeCd(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? pdCategoryProd.categoryProdTypeCd.eq(search.getTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdCategoryProdDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdCategoryProd.regDate.goe(start).and(pdCategoryProd.regDate.lt(endExcl));
            case "upd_date": return pdCategoryProd.updDate.goe(start).and(pdCategoryProd.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdCategoryProdDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",categoryId,", pdCategoryProd.categoryId, pattern);
        or = orLike(or, all, types, ",categoryProdId,", pdCategoryProd.categoryProdId, pattern);
        or = orLike(or, all, types, ",categoryProdTypeCd,", pdCategoryProd.categoryProdTypeCd, pattern);
        or = orLike(or, all, types, ",dispYn,", pdCategoryProd.dispYn, pattern);
        or = orLike(or, all, types, ",emphasisCd,", pdCategoryProd.emphasisCd, pattern);
        or = orLike(or, all, types, ",prodId,", pdCategoryProd.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pdCategoryProd.siteId, pattern);
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
