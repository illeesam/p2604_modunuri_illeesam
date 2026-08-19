package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdSkuStockHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdSkuStockHistRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdhProdSkuStockHist QueryDSL Custom 구현체 — write-once 로그성 (updBy/updDate 없음) */
@RequiredArgsConstructor
public class QPdhProdSkuStockHistRepositoryImpl implements QPdhProdSkuStockHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdSkuStockHistRepositoryImpl";
    private static final QPdhProdSkuStockHist pdhProdSkuStockHist      = QPdhProdSkuStockHist.pdhProdSkuStockHist;
    private static final QSySite              sySite    = QSySite.sySite;
    private static final QPdProd              pdProd    = QPdProd.pdProd;
    private static final QVwSyCode              cd_ssc = new QVwSyCode("cd_ssc");

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (Entity 주석 기준 — SKU_STOCK_CHG)
     * CHG_REASON_CD  {SALE: '판매', PURCHASE: '매입/입고', RETURN: '반품', EXCHANGE: '교환', ADJUST: '재고조정', CLAIM: '클레임', ADMIN: '관리자수동'}
     */
    /* 상품 SKU 재고 이력 baseSelColumnQuery */
    private JPAQuery<PdhProdSkuStockHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdSkuStockHistDto.Item.class,
                        pdhProdSkuStockHist.histId,          // 이력ID (PK, YYMMDDhhmmss+rand4)
                        pdhProdSkuStockHist.prodSkuId,        // SKU ID (pd_prod_sku.prod_sku_id)
                        pdhProdSkuStockHist.prodId,           // 상품ID (pd_prod.prod_id)
                        pdhProdSkuStockHist.stockBefore,     // 변경 전 재고수량
                        pdhProdSkuStockHist.stockAfter,      // 변경 후 재고수량
                        pdhProdSkuStockHist.chgQty,          // 변동수량 (양수=입고, 음수=출고/판매)
                        pdhProdSkuStockHist.chgReasonCd,       // 변동사유 — {SALE: '판매', PURCHASE: '매입/입고', RETURN: '반품', EXCHANGE: '교환', ADJUST: '재고조정', CLAIM: '클레임', ADMIN: '관리자수동'}
                        pdhProdSkuStockHist.chgReason,       // 변동사유 상세
                        pdhProdSkuStockHist.orderItemId,     // 연관 주문상품ID (od_order_item.order_item_id)
                        pdhProdSkuStockHist.chgBy,           // 처리자 (sy_user.user_id)
                        pdhProdSkuStockHist.chgDate,         // 처리일시
                        pdhProdSkuStockHist.regBy,
                        pdhProdSkuStockHist.regDate
                ))
                .from(pdhProdSkuStockHist)
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdhProdSkuStockHist.prodId))
                .leftJoin(cd_ssc).on(cd_ssc.codeGrp.eq("CHG_REASON_CD").and(cd_ssc.codeValue.eq(pdhProdSkuStockHist.chgReasonCd)));
    }

    /* 상품 SKU 재고 이력 키조회 */
    @Override
    public Optional<PdhProdSkuStockHistDto.Item> selectById(String id) {
        PdhProdSkuStockHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdhProdSkuStockHist.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 SKU 재고 이력 목록조회 */
    @Override
    public List<PdhProdSkuStockHistDto.Item> selectList(PdhProdSkuStockHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pdhProdSkuStockHist.histId, search.getHistId()));
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdhProdSkuStockHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres2)
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

    /* 상품 SKU 재고 이력 페이지조회 */
    @Override
    public BasePage<PdhProdSkuStockHistDto.Item> selectPageData(PdhProdSkuStockHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pdhProdSkuStockHist.histId, search.getHistId()));
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<PdhProdSkuStockHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdhProdSkuStockHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdhProdSkuStockHist.count())
                .where(wheres2)
                .fetchOne();

        BasePage<PdhProdSkuStockHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("chgBy", pdhProdSkuStockHist.chgBy),
            QdslUtil.FieldDef.like("chgReason", pdhProdSkuStockHist.chgReason),
            QdslUtil.FieldDef.like("chgReasonCd", pdhProdSkuStockHist.chgReasonCd),
            QdslUtil.FieldDef.like("histId", pdhProdSkuStockHist.histId),
            QdslUtil.FieldDef.like("orderItemId", pdhProdSkuStockHist.orderItemId),
            QdslUtil.FieldDef.like("prodId", pdhProdSkuStockHist.prodId),
            QdslUtil.FieldDef.like("skuId", pdhProdSkuStockHist.prodSkuId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("histId", pdhProdSkuStockHist.histId,
                   "regDate", pdhProdSkuStockHist.regDate),
        new OrderSpecifier<>(Order.DESC, pdhProdSkuStockHist.regDate),
        new OrderSpecifier<>(Order.ASC, pdhProdSkuStockHist.histId));
    }

    /* 상품 SKU 재고 이력 수정 */
    @Override
    public int updateSelective(PdhProdSkuStockHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdSkuStockHist);
        boolean hasAny = false;

        if (entity.getProdSkuId()   != null) { update.set(pdhProdSkuStockHist.prodSkuId,   entity.getProdSkuId());   hasAny = true; }
        if (entity.getProdId()      != null) { update.set(pdhProdSkuStockHist.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getStockBefore() != null) { update.set(pdhProdSkuStockHist.stockBefore, entity.getStockBefore()); hasAny = true; }
        if (entity.getStockAfter()  != null) { update.set(pdhProdSkuStockHist.stockAfter,  entity.getStockAfter());  hasAny = true; }
        if (entity.getChgQty()      != null) { update.set(pdhProdSkuStockHist.chgQty,      entity.getChgQty());      hasAny = true; }
        if (entity.getChgReasonCd() != null) { update.set(pdhProdSkuStockHist.chgReasonCd, entity.getChgReasonCd()); hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(pdhProdSkuStockHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getOrderItemId() != null) { update.set(pdhProdSkuStockHist.orderItemId, entity.getOrderItemId()); hasAny = true; }
        if (entity.getChgBy()       != null) { update.set(pdhProdSkuStockHist.chgBy,       entity.getChgBy());       hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(pdhProdSkuStockHist.chgDate,     entity.getChgDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pdhProdSkuStockHist.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
