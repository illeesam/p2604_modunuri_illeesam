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
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdCategory QueryDSL Custom 구현체 */
public class QPdCategoryRepositoryImpl implements QPdCategoryRepository {

    private final JPAQueryFactory queryFactory;
    private final PdCategoryRepository pdCategoryRepository;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdCategoryRepositoryImpl";
    private static final QPdCategory c   = QPdCategory.pdCategory;

    public QPdCategoryRepositoryImpl(JPAQueryFactory queryFactory, @Lazy PdCategoryRepository pdCategoryRepository) {
        this.queryFactory = queryFactory;
        this.pdCategoryRepository = pdCategoryRepository;
    }
    private static final QPdCategory p1  = new QPdCategory("p1");
    private static final QPdCategory p2  = new QPdCategory("p2");
    private static final QSyCode     cdCs = new QSyCode("cd_cs");

    /* 상품 카테고리 키조회 */
    @Override
    public Optional<PdCategoryDto.Item> selectById(String categoryId) {
        PdCategoryDto.Item dto = baseQuery()
                .where(c.categoryId.eq(categoryId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 카테고리 목록조회 */
    @Override
    public List<PdCategoryDto.Item> selectList(PdCategoryDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryDto.Item> query = baseQuery().where(
                andSiteId(search),
                andCategoryId(search),
                andParentCategoryId(search),
                andStatus(search),
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

    /* 상품 카테고리 페이지조회 */
    @Override
    public PdCategoryDto.PageResponse selectPageList(PdCategoryDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdCategoryDto.Item> query = baseQuery().where(
                andSiteId(search),
                andCategoryId(search),
                andParentCategoryId(search),
                andStatus(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdCategoryDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(c.count()).from(c).where(
                andSiteId(search),
                andCategoryId(search),
                andParentCategoryId(search),
                andStatus(search),
                andSearchValue(search)
        ).fetchOne();

        PdCategoryDto.PageResponse res = new PdCategoryDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    private JPAQuery<PdCategoryDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdCategoryDto.Item.class,
                        c.categoryId, c.siteId, c.parentCategoryId, c.categoryNm,
                        c.categoryDepth, c.sortOrd, c.categoryStatusCd, c.categoryStatusCdBefore,
                        c.imgUrl, c.categoryDesc,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        p1.categoryNm.as("parentCategoryNm"),
                        p2.categoryNm.as("grandParentCategoryNm"),
                        cdCs.codeLabel.as("categoryStatusCdNm")
                ))
                .from(c)
                .leftJoin(p1).on(p1.categoryId.eq(c.parentCategoryId))
                .leftJoin(p2).on(p2.categoryId.eq(p1.parentCategoryId))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("USE_YN").and(cdCs.codeValue.eq(c.categoryStatusCd)));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PdCategoryDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? c.siteId.eq(search.getSiteId()) : null;
    }

    /* categoryId 정확 일치 */
    private BooleanExpression andCategoryId(PdCategoryDto.Request search) {
        return search != null && StringUtils.hasText(search.getCategoryId())
                ? c.categoryId.eq(search.getCategoryId()) : null;
    }

    /* 카테고리 트리 — 선택 노드 + 모든 자손 카테고리 포함 */
    private BooleanExpression andParentCategoryId(PdCategoryDto.Request search) {
        return search != null && StringUtils.hasText(search.getParentCategoryId())
                ? c.categoryId.in(pdCategoryRepository.findTreeCategoryIds(search.getParentCategoryId()))
                : null;
    }

    /* categoryStatusCd 정확 일치 */
    private BooleanExpression andStatus(PdCategoryDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? c.categoryStatusCd.eq(search.getStatus()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PdCategoryDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",categoryDesc,", c.categoryDesc, pattern);
        or = orLike(or, all, types, ",categoryId,", c.categoryId, pattern);
        or = orLike(or, all, types, ",categoryNm,", c.categoryNm, pattern);
        or = orLike(or, all, types, ",categoryStatusCd,", c.categoryStatusCd, pattern);
        or = orLike(or, all, types, ",categoryStatusCdBefore,", c.categoryStatusCdBefore, pattern);
        or = orLike(or, all, types, ",imgUrl,", c.imgUrl, pattern);
        or = orLike(or, all, types, ",parentCategoryId,", c.parentCategoryId, pattern);
        or = orLike(or, all, types, ",siteId,", c.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdCategoryDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, c.categoryDepth));
            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, c.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.categoryId));

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
                    orders.add(new OrderSpecifier(order, c.categoryId));
                } else if ("categoryNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.categoryNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, c.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, c.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.categoryId));
        }
        return orders;
    }

    /* 상품 카테고리 수정 */
    @Override
    public int updateSelective(PdCategory entity) {
        if (entity.getCategoryId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getCategoryNm()             != null) { update.set(c.categoryNm,             entity.getCategoryNm());             hasAny = true; }
        if (entity.getCategoryStatusCd()       != null) { update.set(c.categoryStatusCd,       entity.getCategoryStatusCd());       hasAny = true; }
        if (entity.getCategoryStatusCdBefore() != null) { update.set(c.categoryStatusCdBefore, entity.getCategoryStatusCdBefore()); hasAny = true; }
        if (entity.getSortOrd()                != null) { update.set(c.sortOrd,                entity.getSortOrd());                hasAny = true; }
        if (entity.getImgUrl()                 != null) { update.set(c.imgUrl,                 entity.getImgUrl());                 hasAny = true; }
        if (entity.getCategoryDesc()           != null) { update.set(c.categoryDesc,           entity.getCategoryDesc());           hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(c.updBy,                  entity.getUpdBy());                  hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(c.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(c.categoryId.eq(entity.getCategoryId())).execute();
        return (int) affected;
    }
}
