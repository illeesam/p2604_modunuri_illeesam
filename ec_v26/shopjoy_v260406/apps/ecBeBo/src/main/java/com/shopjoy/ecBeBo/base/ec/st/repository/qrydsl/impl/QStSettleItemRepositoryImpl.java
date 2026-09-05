package com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.QStSettleItem;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStSettleItemRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** StSettleItem(정산 항목 (주문항목별 명세)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleItemRepositoryImpl implements QStSettleItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleItemRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QStSettleItem stSettleItem    = QStSettleItem.stSettleItem;
    private static final QOdOrder      odOrder  = QOdOrder.odOrder;
    private static final QOdOrderItem  odOrderItem  = QOdOrderItem.odOrderItem;
    private static final QSySite       sySite  = QSySite.sySite;
    private static final QVwSyCode       codeSettleItemTypeCd = new QVwSyCode("cd_sit");    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * SETTLE_ITEM_TYPE  {SALE: '판매', CANCEL: '취소/반품', DISCNT: '할인분담', GIFT: '사은품분담', SHIP: '배송비', ADJ: '조정'}
     * (Entity 주석상 SALE/CANCEL/RETURN — sy_code 실 데이터에는 CANCEL 하나로 취소/반품 통합 + DISCNT/GIFT/SHIP/ADJ 추가 존재)
     */
    private JPAQuery<StSettleItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleItemDto.Item.class,
                        stSettleItem.settleItemId,       // 정산항목ID (PK)
                        stSettleItem.settleId,            // 정산ID (st_settle.settle_id)
                        stSettleItem.orderId,              // 주문ID (od_order.order_id)
                        stSettleItem.orderItemId,          // 주문항목ID (od_order_item.order_item_id)
                        stSettleItem.vendorId,             // 업체ID
                        stSettleItem.prodId,               // 상품ID
                        stSettleItem.settleItemTypeCd,     // 항목유형 — SETTLE_ITEM_TYPE {SALE: '판매', CANCEL: '취소/반품', DISCNT: '할인분담', GIFT: '사은품분담', SHIP: '배송비', ADJ: '조정'}
                        stSettleItem.orderDate,            // 주문일시
                        stSettleItem.orderQty,             // 주문수량
                        stSettleItem.unitPrice,            // 단가
                        stSettleItem.itemPrice,            // 소계 (unit_price × order_qty)
                        stSettleItem.discntAmt,            // 할인금액
                        stSettleItem.commissionRate,       // 수수료율 (%)
                        stSettleItem.commissionAmt,        // 수수료금액
                        stSettleItem.settleItemAmt,        // 항목 정산금액
                        stSettleItem.regBy,                // 등록자
                        stSettleItem.regDate,               // 등록일시
                        odOrder.memberNm.as("orderNm"),                     // 주문 회원명 (조인)
                        odOrderItem.prodNm.as("orderItemNm"),               // 주문항목 상품명 (조인)
                        codeSettleItemTypeCd.codeLabel.as("settleItemTypeCdNm"),            // 항목유형명 (sy_code 조인)
                        stSettleItem.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(stSettleItem)
                .innerJoin(odOrder).on(odOrder.orderId.eq(stSettleItem.orderId)) // 주문
                .innerJoin(odOrderItem).on(odOrderItem.orderItemId.eq(stSettleItem.orderItemId)) // 주문상품
                .leftJoin(codeSettleItemTypeCd).on(codeSettleItemTypeCd.codeGrp.eq("SETTLE_ITEM_TYPE_CD").and(codeSettleItemTypeCd.codeValue.eq(stSettleItem.settleItemTypeCd))) // 정산항목유형
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(stSettleItem.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(stSettleItem.regBy)) // 등록자
                ;
    }

    /* 정산 항목 키조회 */
    @Override
    public Optional<StSettleItemDto.Item> selectById(String id) {
        StSettleItemDto.Item dtl = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettleItem.settleItemId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 정산 항목 목록조회 */
    @Override
    public List<StSettleItemDto.Item> selectList(StSettleItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettleItem.settleItemId, search.getSettleItemId())); // 정산항목ID 필터
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("order_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleItem.orderDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<StSettleItemDto.Item> query = baseListQuery()
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
        List<StSettleItemDto.Item> list = query.fetch();
        return list;
    }

    /* 정산 항목 페이지조회 */
    @Override
    public BasePage<StSettleItemDto.Item> selectPageData(StSettleItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettleItem.settleItemId, search.getSettleItemId())); // 정산항목ID 필터
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("order_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleItem.orderDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<StSettleItemDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<StSettleItemDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettleItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<StSettleItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "orderId,orderItemId,prodId,settleId,settleItemId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("orderId", stSettleItem.orderId), // 주문ID (od_order.order_id)
            QdslUtil.FieldDef.like("orderItemId", stSettleItem.orderItemId), // 주문항목ID (od_order_item.order_item_id)
            QdslUtil.FieldDef.like("prodId", stSettleItem.prodId), // 상품ID
            QdslUtil.FieldDef.like("settleId", stSettleItem.settleId), // 정산ID (st_settle.settle_id)
            QdslUtil.FieldDef.like("settleItemId", stSettleItem.settleItemId), // 정산항목ID 필터
            QdslUtil.FieldDef.like("settleItemTypeCd", stSettleItem.settleItemTypeCd), // 항목유형 — SETTLE_ITEM_TYPE_CD (SALE/CANCEL/RETURN)
            QdslUtil.FieldDef.like("vendorId", stSettleItem.vendorId) // 업체ID
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("settleItemId", stSettleItem.settleItemId,
                   "orderDate", stSettleItem.orderDate),
        new OrderSpecifier<>(Order.DESC, stSettleItem.regDate),
        new OrderSpecifier<>(Order.ASC, stSettleItem.settleItemId));
    }

    /* 정산 항목 수정 */
    @Override
    public int updateSelective(StSettleItem entity) {
        if (entity.getSettleItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleItem);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(stSettleItem.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getOrderId()          != null) { update.set(stSettleItem.orderId,          entity.getOrderId());          hasAny = true; }
        if (entity.getOrderItemId()      != null) { update.set(stSettleItem.orderItemId,      entity.getOrderItemId());      hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(stSettleItem.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getProdId()           != null) { update.set(stSettleItem.prodId,           entity.getProdId());           hasAny = true; }
        if (entity.getSettleItemTypeCd() != null) { update.set(stSettleItem.settleItemTypeCd, entity.getSettleItemTypeCd()); hasAny = true; }
        if (entity.getOrderDate()        != null) { update.set(stSettleItem.orderDate,        entity.getOrderDate());        hasAny = true; }
        if (entity.getOrderQty()         != null) { update.set(stSettleItem.orderQty,         entity.getOrderQty());         hasAny = true; }
        if (entity.getUnitPrice()        != null) { update.set(stSettleItem.unitPrice,        entity.getUnitPrice());        hasAny = true; }
        if (entity.getItemPrice()        != null) { update.set(stSettleItem.itemPrice,        entity.getItemPrice());        hasAny = true; }
        if (entity.getDiscntAmt()        != null) { update.set(stSettleItem.discntAmt,        entity.getDiscntAmt());        hasAny = true; }
        if (entity.getCommissionRate()   != null) { update.set(stSettleItem.commissionRate,   entity.getCommissionRate());   hasAny = true; }
        if (entity.getCommissionAmt()    != null) { update.set(stSettleItem.commissionAmt,    entity.getCommissionAmt());    hasAny = true; }
        if (entity.getSettleItemAmt()    != null) { update.set(stSettleItem.settleItemAmt,    entity.getSettleItemAmt());    hasAny = true; }
        update.set(stSettleItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettleItem.settleItemId.eq(entity.getSettleItemId())).execute();
        return (int) affected;
    }
}
