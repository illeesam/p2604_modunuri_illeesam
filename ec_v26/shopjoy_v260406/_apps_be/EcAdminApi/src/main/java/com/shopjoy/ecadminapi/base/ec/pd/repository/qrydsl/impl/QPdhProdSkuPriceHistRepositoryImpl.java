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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdSkuPriceHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdhProdSkuPriceHist QueryDSL Custom 구현체 — write-once 로그성 (updBy/updDate 없음) */
@RequiredArgsConstructor
public class QPdhProdSkuPriceHistRepositoryImpl implements QPdhProdSkuPriceHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdSkuPriceHistRepositoryImpl";
    private static final QPdhProdSkuPriceHist pdhProdSkuPriceHist   = QPdhProdSkuPriceHist.pdhProdSkuPriceHist;
    private static final QSySite              sySite = QSySite.sySite;
    private static final QPdProd              pdProd = QPdProd.pdProd;

    /* 상품 SKU 가격 이력 baseSelColumnQuery — 코드성 필드 없음 (금액 이력) */
    private JPAQuery<PdhProdSkuPriceHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdSkuPriceHistDto.Item.class,
                        pdhProdSkuPriceHist.histId,          // 이력ID (PK, YYMMDDhhmmss+rand4)
                        pdhProdSkuPriceHist.prodSkuId,        // SKU ID (pd_prod_sku.prod_sku_id)
                        pdhProdSkuPriceHist.prodId,           // 상품ID (pd_prod.prod_id)
                        pdhProdSkuPriceHist.addPriceBefore,   // 변경 전 옵션 추가금액
                        pdhProdSkuPriceHist.addPriceAfter,    // 변경 후 옵션 추가금액
                        pdhProdSkuPriceHist.chgReason,       // 변경사유
                        pdhProdSkuPriceHist.chgBy,           // 처리자 (sy_user.user_id)
                        pdhProdSkuPriceHist.chgDate,         // 처리일시
                        pdhProdSkuPriceHist.regBy,
                        pdhProdSkuPriceHist.regDate
                ))
                .from(pdhProdSkuPriceHist)
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdhProdSkuPriceHist.prodId)) // 상품
                ;
    }

    /* 상품 SKU 가격 이력 키조회 */
    @Override
    public Optional<PdhProdSkuPriceHistDto.Item> selectById(String id) {
        PdhProdSkuPriceHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdhProdSkuPriceHist.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 상품 SKU 가격 이력 목록조회 */
    @Override
    public List<PdhProdSkuPriceHistDto.Item> selectList(PdhProdSkuPriceHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdhProdSkuPriceHist.histId, search.getHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdhProdSkuPriceHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PdhProdSkuPriceHistDto.Item> list = query.fetch();
        return list;
    }

    /* 상품 SKU 가격 이력 페이지조회 */
    @Override
    public BasePage<PdhProdSkuPriceHistDto.Item> selectPageData(PdhProdSkuPriceHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdhProdSkuPriceHist.histId, search.getHistId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<PdhProdSkuPriceHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdhProdSkuPriceHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdhProdSkuPriceHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdhProdSkuPriceHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("chgBy", pdhProdSkuPriceHist.chgBy),
            QdslUtil.FieldDef.like("chgReason", pdhProdSkuPriceHist.chgReason),
            QdslUtil.FieldDef.like("histId", pdhProdSkuPriceHist.histId),
            QdslUtil.FieldDef.like("prodId", pdhProdSkuPriceHist.prodId),
            QdslUtil.FieldDef.like("skuId", pdhProdSkuPriceHist.prodSkuId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("histId", pdhProdSkuPriceHist.histId,
                   "regDate", pdhProdSkuPriceHist.regDate),
        new OrderSpecifier<>(Order.DESC, pdhProdSkuPriceHist.regDate),
        new OrderSpecifier<>(Order.ASC, pdhProdSkuPriceHist.histId));
    }

    /* 상품 SKU 가격 이력 수정 */
    @Override
    public int updateSelective(PdhProdSkuPriceHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdSkuPriceHist);
        boolean hasAny = false;

        if (entity.getProdSkuId()      != null) { update.set(pdhProdSkuPriceHist.prodSkuId,      entity.getProdSkuId());      hasAny = true; }
        if (entity.getProdId()         != null) { update.set(pdhProdSkuPriceHist.prodId,         entity.getProdId());         hasAny = true; }
        if (entity.getAddPriceBefore() != null) { update.set(pdhProdSkuPriceHist.addPriceBefore, entity.getAddPriceBefore()); hasAny = true; }
        if (entity.getAddPriceAfter()  != null) { update.set(pdhProdSkuPriceHist.addPriceAfter,  entity.getAddPriceAfter());  hasAny = true; }
        if (entity.getChgReason()      != null) { update.set(pdhProdSkuPriceHist.chgReason,      entity.getChgReason());      hasAny = true; }
        if (entity.getChgBy()          != null) { update.set(pdhProdSkuPriceHist.chgBy,          entity.getChgBy());          hasAny = true; }
        if (entity.getChgDate()        != null) { update.set(pdhProdSkuPriceHist.chgDate,        entity.getChgDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pdhProdSkuPriceHist.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
