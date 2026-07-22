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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdSetItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdProdSetItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdSetItemRepositoryImpl implements QPdProdSetItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdSetItemRepositoryImpl";
    private static final QPdProdSetItem pdProdSetItem    = QPdProdSetItem.pdProdSetItem;
    private static final QSySite        sySite  = QSySite.sySite;
    private static final QPdProd        prd  = new QPdProd("prd");
    private static final QPdProd        prd2 = new QPdProd("prd2");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdProdSetItem.regDate,
        "upd_date", pdProdSetItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("itemDesc", pdProdSetItem.itemDesc),
        Map.entry("itemNm", pdProdSetItem.itemNm),
        Map.entry("itemProdId", pdProdSetItem.itemProdId),
        Map.entry("itemSkuId", pdProdSetItem.itemSkuId),
        Map.entry("setItemId", pdProdSetItem.setItemId),
        Map.entry("setProdId", pdProdSetItem.setProdId),
        Map.entry("siteId", pdProdSetItem.siteId),
        Map.entry("useYn", pdProdSetItem.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN  {Y: '사용', N: '미사용'}
     */
    /* 세트상품 구성 baseSelColumnQuery */
    private JPAQuery<PdProdSetItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdSetItemDto.Item.class,
                        pdProdSetItem.setItemId,     // 세트구성ID (PK, YYMMDDhhmmss+rand4)
                        pdProdSetItem.siteId,         // 사이트ID (sy_site.site_id)
                        pdProdSetItem.setProdId,       // 세트상품ID (pd_prod.prod_id, prod_type_cd=SET)
                        pdProdSetItem.itemProdId,      // 구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)
                        pdProdSetItem.itemSkuId,       // 구성품 SKU ID (pd_prod_sku.prod_sku_id, NULL=SKU 미지정)
                        pdProdSetItem.itemNm,         // 구성품 표시명 (예: 머그컵, 접시 2p)
                        pdProdSetItem.itemQty,        // 구성 수량
                        pdProdSetItem.itemDesc,       // 구성품 부가 설명 (소재·용량·색상 등)
                        pdProdSetItem.sortOrd,        // 노출 정렬 순서
                        pdProdSetItem.useYn,           // 사용여부 — {Y: '사용', N: '미사용'}
                        pdProdSetItem.regBy, pdProdSetItem.regDate, pdProdSetItem.updBy, pdProdSetItem.updDate
                ))
                .from(pdProdSetItem)
                .leftJoin(sySite).on(sySite.siteId.eq(pdProdSetItem.siteId))
                .leftJoin(prd).on(prd.prodId.eq(pdProdSetItem.setProdId))
                .leftJoin(prd2).on(prd2.prodId.eq(pdProdSetItem.itemProdId));
    }

    /* 세트상품 구성 키조회 */
    @Override
    public Optional<PdProdSetItemDto.Item> selectById(String setItemId) {
        PdProdSetItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdSetItem.setItemId.eq(setItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 세트상품 구성 목록조회 */
    @Override
    public List<PdProdSetItemDto.Item> selectList(PdProdSetItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdSetItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pdProdSetItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdProdSetItem.setItemId, search.getSetItemId()),
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

    /* 세트상품 구성 페이지조회 */
    @Override
    public PdProdSetItemDto.PageResponse selectPageData(PdProdSetItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdProdSetItem.siteId, search.getSiteId()),
                QdslUtil.strEq(pdProdSetItem.setItemId, search.getSetItemId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdSetItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdSetItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdSetItem.count())
                .where(wheres)
                .fetchOne();

        PdProdSetItemDto.PageResponse res = new PdProdSetItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PdProdSetItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdSetItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSetItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSetItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSetItem.setItemId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("setItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdSetItem.setItemId));
                } else if ("itemNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdSetItem.itemNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdSetItem.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pdProdSetItem.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSetItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSetItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdSetItem.setItemId));
        }
        return orders;
    }

    /* 세트상품 구성 수정 */

    @Override
    public int updateSelective(PdProdSetItem entity) {
        if (entity.getSetItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdSetItem);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(pdProdSetItem.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getSetProdId()  != null) { update.set(pdProdSetItem.setProdId,  entity.getSetProdId());  hasAny = true; }
        if (entity.getItemProdId() != null) { update.set(pdProdSetItem.itemProdId, entity.getItemProdId()); hasAny = true; }
        if (entity.getItemSkuId()  != null) { update.set(pdProdSetItem.itemSkuId,  entity.getItemSkuId());  hasAny = true; }
        if (entity.getItemNm()     != null) { update.set(pdProdSetItem.itemNm,     entity.getItemNm());     hasAny = true; }
        if (entity.getItemQty()    != null) { update.set(pdProdSetItem.itemQty,    entity.getItemQty());    hasAny = true; }
        if (entity.getItemDesc()   != null) { update.set(pdProdSetItem.itemDesc,   entity.getItemDesc());   hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(pdProdSetItem.sortOrd,    entity.getSortOrd());    hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(pdProdSetItem.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(pdProdSetItem.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdSetItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdSetItem.setItemId.eq(entity.getSetItemId())).execute();
        return (int) affected;
    }
}
