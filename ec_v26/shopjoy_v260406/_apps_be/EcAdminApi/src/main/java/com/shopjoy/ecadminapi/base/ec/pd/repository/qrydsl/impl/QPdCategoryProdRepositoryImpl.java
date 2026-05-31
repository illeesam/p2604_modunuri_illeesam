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
import java.util.List;
import java.util.Optional;
/** PdCategoryProd QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdCategoryProdRepositoryImpl implements QPdCategoryProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdCategoryProdRepositoryImpl";
    private static final QPdCategoryProd p   = QPdCategoryProd.pdCategoryProd;
    private static final QSySite         ste = QSySite.sySite;
    private static final QPdCategory     cat = QPdCategory.pdCategory;
    private static final QPdProd         prd = QPdProd.pdProd;

    /* 카테고리-상품 매핑 키조회 */
    @Override
    public Optional<PdCategoryProdDto.Item> selectById(String categoryProdId) {
        PdCategoryProdDto.Item dto = baseQuery()
                .where(p.categoryProdId.eq(categoryProdId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 카테고리-상품 매핑 목록조회 */
    @Override
    public List<PdCategoryProdDto.Item> selectList(PdCategoryProdDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryProdDto.Item> query = baseQuery().where(
                andSiteId(search),
                andCategoryProdId(search),
                andProdId(search),
                andTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
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
    public PdCategoryProdDto.PageResponse selectPageList(PdCategoryProdDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryProdDto.Item> query = baseQuery().where(
                andSiteId(search),
                andCategoryProdId(search),
                andProdId(search),
                andTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdCategoryProdDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(p.count()).from(p).where(
                andSiteId(search),
                andCategoryProdId(search),
                andProdId(search),
                andTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        PdCategoryProdDto.PageResponse res = new PdCategoryProdDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 카테고리-상품 매핑 baseQuery */
    private JPAQuery<PdCategoryProdDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdCategoryProdDto.Item.class,
                        p.categoryProdId, p.siteId, p.categoryId, p.prodId,
                        p.categoryProdTypeCd, p.sortOrd, p.emphasisCd,
                        p.dispYn, p.dispStartDate, p.dispEndDate,
                        p.regBy, p.regDate, p.updBy, p.updDate,
                        ste.siteNm.as("siteNm"),
                        cat.categoryNm.as("categoryNm"),
                        prd.prodNm.as("prodNm")
                ))
                .from(p)
                .leftJoin(ste).on(ste.siteId.eq(p.siteId))
                .leftJoin(cat).on(cat.categoryId.eq(p.categoryId))
                .leftJoin(prd).on(prd.prodId.eq(p.prodId));
    }

    /* 카테고리-상품 매핑 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? p.siteId.eq(search.getSiteId()) : null;
    }

    /* categoryProdId 정확 일치 */
    private BooleanExpression andCategoryProdId(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getCategoryProdId())
                ? p.categoryProdId.eq(search.getCategoryProdId()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression andProdId(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? p.prodId.eq(search.getProdId()) : null;
    }

    /* categoryProdTypeCd 정확 일치 */
    private BooleanExpression andTypeCd(PdCategoryProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? p.categoryProdTypeCd.eq(search.getTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PdCategoryProdDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return p.regDate.goe(start).and(p.regDate.lt(endExcl));
            case "upd_date": return p.updDate.goe(start).and(p.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PdCategoryProdDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",categoryId,", p.categoryId, pattern);
        or = orLike(or, all, types, ",categoryProdId,", p.categoryProdId, pattern);
        or = orLike(or, all, types, ",categoryProdTypeCd,", p.categoryProdTypeCd, pattern);
        or = orLike(or, all, types, ",dispYn,", p.dispYn, pattern);
        or = orLike(or, all, types, ",emphasisCd,", p.emphasisCd, pattern);
        or = orLike(or, all, types, ",prodId,", p.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", p.siteId, pattern);
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
            orders.add(new OrderSpecifier<>(Order.ASC, p.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.categoryProdId));

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
                    orders.add(new OrderSpecifier(order, p.categoryProdId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, p.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, p.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.categoryProdId));
        }
        return orders;
    }

    /* 카테고리-상품 매핑 수정 */
    @Override
    public int updateSelective(PdCategoryProd entity) {
        if (entity.getCategoryProdId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(p.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getCategoryId()         != null) { update.set(p.categoryId,         entity.getCategoryId());         hasAny = true; }
        if (entity.getProdId()             != null) { update.set(p.prodId,             entity.getProdId());             hasAny = true; }
        if (entity.getCategoryProdTypeCd() != null) { update.set(p.categoryProdTypeCd, entity.getCategoryProdTypeCd()); hasAny = true; }
        if (entity.getSortOrd()            != null) { update.set(p.sortOrd,            entity.getSortOrd());            hasAny = true; }
        if (entity.getEmphasisCd()         != null) { update.set(p.emphasisCd,         entity.getEmphasisCd());         hasAny = true; }
        if (entity.getDispYn()             != null) { update.set(p.dispYn,             entity.getDispYn());             hasAny = true; }
        if (entity.getDispStartDate()      != null) { update.set(p.dispStartDate,      entity.getDispStartDate());      hasAny = true; }
        if (entity.getDispEndDate()        != null) { update.set(p.dispEndDate,        entity.getDispEndDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(p.categoryProdId.eq(entity.getCategoryProdId())).execute();
        return (int) affected;
    }
}
