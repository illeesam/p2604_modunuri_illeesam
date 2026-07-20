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
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdBundleItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdProdBundleItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdBundleItemRepositoryImpl implements QPdProdBundleItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdBundleItemRepositoryImpl";
    private static final QPdProdBundleItem pdProdBundleItem    = QPdProdBundleItem.pdProdBundleItem;
    private static final QSySite           sySite  = QSySite.sySite;
    private static final QPdProd           prd  = new QPdProd("prd");
    private static final QPdProd           prd2 = new QPdProd("prd2");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdProdBundleItem.regDate,
        "upd_date", pdProdBundleItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("bundleItemId", pdProdBundleItem.bundleItemId),
        Map.entry("bundleProdId", pdProdBundleItem.bundleProdId),
        Map.entry("itemProdId", pdProdBundleItem.itemProdId),
        Map.entry("itemSkuId", pdProdBundleItem.itemSkuId),
        Map.entry("siteId", pdProdBundleItem.siteId),
        Map.entry("useYn", pdProdBundleItem.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN  {Y: '사용', N: '미사용'}
     */
    /* 묶음상품 구성 baseSelColumnQuery */
    private JPAQuery<PdProdBundleItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdBundleItemDto.Item.class,
                        pdProdBundleItem.bundleItemId,   // 묶음구성ID (PK, YYMMDDhhmmss+rand4)
                        pdProdBundleItem.siteId,          // 사이트ID (sy_site.site_id)
                        pdProdBundleItem.bundleProdId,     // 묶음상품ID (pd_prod.prod_id, prod_type_cd=BUNDLE)
                        pdProdBundleItem.itemProdId,       // 구성품 상품ID (pd_prod.prod_id) — 독립 판매 상품
                        pdProdBundleItem.itemSkuId,        // 구성품 SKU ID (pd_prod_sku.prod_sku_id, NULL=SKU 미지정)
                        pdProdBundleItem.itemQty,          // 구성 수량 (기본 1)
                        pdProdBundleItem.priceRate,        // 가격 안분율(%) — 구성품 합계 100% 필수, 부분클레임 환불 계산 기준
                        pdProdBundleItem.sortOrd,          // 노출 정렬 순서
                        pdProdBundleItem.useYn,             // 사용여부 — {Y: '사용', N: '미사용'}
                        pdProdBundleItem.regBy, pdProdBundleItem.regDate, pdProdBundleItem.updBy, pdProdBundleItem.updDate
                ))
                .from(pdProdBundleItem)
                .leftJoin(sySite).on(sySite.siteId.eq(pdProdBundleItem.siteId))
                .leftJoin(prd).on(prd.prodId.eq(pdProdBundleItem.bundleProdId))
                .leftJoin(prd2).on(prd2.prodId.eq(pdProdBundleItem.itemProdId));
    }

    /* 묶음상품 구성 키조회 */
    @Override
    public Optional<PdProdBundleItemDto.Item> selectById(String bundleItemId) {
        PdProdBundleItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdBundleItem.bundleItemId.eq(bundleItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 묶음상품 구성 목록조회 */
    @Override
    public List<PdProdBundleItemDto.Item> selectList(PdProdBundleItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdBundleItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pdProdBundleItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdProdBundleItem.bundleItemId, search.getBundleItemId()),
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

    /* 묶음상품 구성 페이지조회 */
    @Override
    public PdProdBundleItemDto.PageResponse selectPageData(PdProdBundleItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdProdBundleItem.siteId, search.getSiteId()),
                QdslUtil.strEq(pdProdBundleItem.bundleItemId, search.getBundleItemId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdBundleItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdBundleItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdBundleItem.count())
                .where(wheres)
                .fetchOne();

        PdProdBundleItemDto.PageResponse res = new PdProdBundleItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdProdBundleItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdBundleItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdBundleItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdBundleItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdBundleItem.bundleItemId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("bundleItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdBundleItem.bundleItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdBundleItem.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pdProdBundleItem.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdBundleItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdBundleItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdBundleItem.bundleItemId));
        }
        return orders;
    }

    /* 묶음상품 구성 수정 */

    @Override
    public int updateSelective(PdProdBundleItem entity) {
        if (entity.getBundleItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdBundleItem);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(pdProdBundleItem.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getBundleProdId() != null) { update.set(pdProdBundleItem.bundleProdId, entity.getBundleProdId()); hasAny = true; }
        if (entity.getItemProdId()   != null) { update.set(pdProdBundleItem.itemProdId,   entity.getItemProdId());   hasAny = true; }
        if (entity.getItemSkuId()    != null) { update.set(pdProdBundleItem.itemSkuId,    entity.getItemSkuId());    hasAny = true; }
        if (entity.getItemQty()      != null) { update.set(pdProdBundleItem.itemQty,      entity.getItemQty());      hasAny = true; }
        if (entity.getPriceRate()    != null) { update.set(pdProdBundleItem.priceRate,    entity.getPriceRate());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(pdProdBundleItem.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(pdProdBundleItem.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(pdProdBundleItem.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdBundleItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdBundleItem.bundleItemId.eq(entity.getBundleItemId())).execute();
        return (int) affected;
    }
}
