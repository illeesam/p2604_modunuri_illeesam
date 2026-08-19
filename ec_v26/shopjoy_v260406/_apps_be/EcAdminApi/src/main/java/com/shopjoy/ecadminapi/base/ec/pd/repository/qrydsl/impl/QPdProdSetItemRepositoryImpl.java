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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdSetItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

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
    private static final QPdProd        prd2 = new QPdProd("prd2");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN  {Y: '사용', N: '미사용'}
     */
    /* 세트상품 구성 baseSelColumnQuery */
    private JPAQuery<PdProdSetItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdSetItemDto.Item.class,
                        pdProdSetItem.prodSetItemId,     // 세트구성ID (PK, YYMMDDhhmmss+rand4)
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
                .leftJoin(prd).on(prd.prodId.eq(pdProdSetItem.setProdId)) // 상품
                .leftJoin(prd2).on(prd2.prodId.eq(pdProdSetItem.itemProdId)) // 상품
                ;
    }

    /* 세트상품 구성 키조회 */
    @Override
    public Optional<PdProdSetItemDto.Item> selectById(String prodSetItemId) {
        PdProdSetItemDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdSetItem.prodSetItemId.eq(prodSetItemId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 세트상품 구성 목록조회 */
    @Override
    public List<PdProdSetItemDto.Item> selectList(PdProdSetItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdProdSetItem.prodSetItemId, search.getProdSetItemId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdSetItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdSetItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdProdSetItemDto.Item> query = baseSelColumnQuery()
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
        List<PdProdSetItemDto.Item> list = query.fetch();
        return list;
    }

    /* 세트상품 구성 페이지조회 */
    @Override
    public BasePage<PdProdSetItemDto.Item> selectPageData(PdProdSetItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdProdSetItem.prodSetItemId, search.getProdSetItemId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdSetItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdSetItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdProdSetItemDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdProdSetItemDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdSetItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdSetItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("itemDesc", pdProdSetItem.itemDesc),
            QdslUtil.FieldDef.like("itemNm", pdProdSetItem.itemNm),
            QdslUtil.FieldDef.like("itemProdId", pdProdSetItem.itemProdId),
            QdslUtil.FieldDef.like("itemSkuId", pdProdSetItem.itemSkuId),
            QdslUtil.FieldDef.like("prodSetItemId", pdProdSetItem.prodSetItemId),
            QdslUtil.FieldDef.like("setProdId", pdProdSetItem.setProdId),
            QdslUtil.FieldDef.like("useYn", pdProdSetItem.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodSetItemId", pdProdSetItem.prodSetItemId,
                   "itemNm", pdProdSetItem.itemNm,
                   "regDate", pdProdSetItem.regDate,
                   "sortOrd", pdProdSetItem.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdSetItem.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdSetItem.regDate),
        new OrderSpecifier<>(Order.ASC, pdProdSetItem.prodSetItemId));
    }

    /* 세트상품 구성 수정 */
    @Override
    public int updateSelective(PdProdSetItem entity) {
        if (entity.getProdSetItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdSetItem);
        boolean hasAny = false;

        if (entity.getSetProdId()  != null) { update.set(pdProdSetItem.setProdId,  entity.getSetProdId());  hasAny = true; }
        if (entity.getItemProdId() != null) { update.set(pdProdSetItem.itemProdId, entity.getItemProdId()); hasAny = true; }
        if (entity.getItemSkuId()  != null) { update.set(pdProdSetItem.itemSkuId,  entity.getItemSkuId());  hasAny = true; }
        if (entity.getItemNm()     != null) { update.set(pdProdSetItem.itemNm,     entity.getItemNm());     hasAny = true; }
        if (entity.getItemQty()    != null) { update.set(pdProdSetItem.itemQty,    entity.getItemQty());    hasAny = true; }
        if (entity.getItemDesc()   != null) { update.set(pdProdSetItem.itemDesc,   entity.getItemDesc());   hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(pdProdSetItem.sortOrd,    entity.getSortOrd());    hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(pdProdSetItem.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(pdProdSetItem.updBy,      entity.getUpdBy());      hasAny = true; }
        update.set(pdProdSetItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdSetItem.prodSetItemId.eq(entity.getProdSetItemId())).execute();
        return (int) affected;
    }
}
