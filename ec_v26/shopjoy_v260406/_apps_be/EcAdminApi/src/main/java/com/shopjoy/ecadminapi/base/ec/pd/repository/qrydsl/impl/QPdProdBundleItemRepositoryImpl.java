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
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdBundleItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

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
    private static final QPdProd           prd2 = new QPdProd("prd2");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN  {Y: '사용', N: '미사용'}
     */
    /* 묶음상품 구성 baseSelColumnQuery */
    private JPAQuery<PdProdBundleItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdBundleItemDto.Item.class,
                        pdProdBundleItem.prodBundleItemId,   // 묶음구성ID (PK, YYMMDDhhmmss+rand4)
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
                .leftJoin(prd).on(prd.prodId.eq(pdProdBundleItem.bundleProdId))
                .leftJoin(prd2).on(prd2.prodId.eq(pdProdBundleItem.itemProdId));
    }

    /* 묶음상품 구성 키조회 */
    @Override
    public Optional<PdProdBundleItemDto.Item> selectById(String prodBundleItemId) {
        PdProdBundleItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdBundleItem.prodBundleItemId.eq(prodBundleItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 묶음상품 구성 목록조회 */
    @Override
    public List<PdProdBundleItemDto.Item> selectList(PdProdBundleItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdProdBundleItem.prodBundleItemId, search.getProdBundleItemId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdBundleItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdBundleItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdProdBundleItemDto.Item> query = baseSelColumnQuery()
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
        return query.fetch();
    }

    /* 묶음상품 구성 페이지조회 */
    @Override
    public BasePage<PdProdBundleItemDto.Item> selectPageData(PdProdBundleItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdProdBundleItem.prodBundleItemId, search.getProdBundleItemId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdBundleItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdBundleItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdProdBundleItemDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdProdBundleItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdBundleItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdBundleItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("prodBundleItemId", pdProdBundleItem.prodBundleItemId),
            QdslUtil.FieldDef.like("bundleProdId", pdProdBundleItem.bundleProdId),
            QdslUtil.FieldDef.like("itemProdId", pdProdBundleItem.itemProdId),
            QdslUtil.FieldDef.like("itemSkuId", pdProdBundleItem.itemSkuId),
            QdslUtil.FieldDef.like("useYn", pdProdBundleItem.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodBundleItemId", pdProdBundleItem.prodBundleItemId,
                   "regDate", pdProdBundleItem.regDate,
                   "sortOrd", pdProdBundleItem.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdBundleItem.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdBundleItem.regDate),
        new OrderSpecifier<>(Order.ASC, pdProdBundleItem.prodBundleItemId));
    }

    /* 묶음상품 구성 수정 */
    @Override
    public int updateSelective(PdProdBundleItem entity) {
        if (entity.getProdBundleItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdBundleItem);
        boolean hasAny = false;

        if (entity.getBundleProdId() != null) { update.set(pdProdBundleItem.bundleProdId, entity.getBundleProdId()); hasAny = true; }
        if (entity.getItemProdId()   != null) { update.set(pdProdBundleItem.itemProdId,   entity.getItemProdId());   hasAny = true; }
        if (entity.getItemSkuId()    != null) { update.set(pdProdBundleItem.itemSkuId,    entity.getItemSkuId());    hasAny = true; }
        if (entity.getItemQty()      != null) { update.set(pdProdBundleItem.itemQty,      entity.getItemQty());      hasAny = true; }
        if (entity.getPriceRate()    != null) { update.set(pdProdBundleItem.priceRate,    entity.getPriceRate());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(pdProdBundleItem.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(pdProdBundleItem.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(pdProdBundleItem.updBy,        entity.getUpdBy());        hasAny = true; }
        update.set(pdProdBundleItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdBundleItem.prodBundleItemId.eq(entity.getProdBundleItemId())).execute();
        return (int) affected;
    }
}
