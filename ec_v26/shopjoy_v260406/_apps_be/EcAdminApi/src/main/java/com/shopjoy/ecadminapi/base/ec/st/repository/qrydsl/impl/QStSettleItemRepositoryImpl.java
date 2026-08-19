package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleItemRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** StSettleItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleItemRepositoryImpl implements QStSettleItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleItemRepositoryImpl";
    private static final QStSettleItem stSettleItem    = QStSettleItem.stSettleItem;
    private static final QOdOrder      odOrder  = QOdOrder.odOrder;
    private static final QOdOrderItem  odOrderItem  = QOdOrderItem.odOrderItem;
    private static final QSySite       sySite  = QSySite.sySite;
    private static final QVwSyCode       cdSit = new QVwSyCode("cd_sit");    /*
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
                        cdSit.codeLabel.as("settleItemTypeCdNm")            // 항목유형명 (sy_code 조인)
                ))
                .from(stSettleItem)
                .leftJoin(odOrder).on(odOrder.orderId.eq(stSettleItem.orderId))
                .leftJoin(odOrderItem).on(odOrderItem.orderItemId.eq(stSettleItem.orderItemId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SETTLE_ITEM_TYPE_CD").and(cdSit.codeValue.eq(stSettleItem.settleItemTypeCd)));
    }

    /* 정산 항목 키조회 */
    @Override
    public Optional<StSettleItemDto.Item> selectById(String id) {
        StSettleItemDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettleItem.settleItemId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 항목 목록조회 */
    @Override
    public List<StSettleItemDto.Item> selectList(StSettleItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(stSettleItem.settleItemId, search.getSettleItemId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("reg_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(stSettleItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(stSettleItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(stSettleItem.orderDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // order_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<StSettleItemDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres.toArray(BooleanExpression[]::new))
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

    /* 정산 항목 페이지조회 */
    @Override
    public BasePage<StSettleItemDto.Item> selectPageData(StSettleItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettleItem.settleItemId, search.getSettleItemId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(stSettleItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(stSettleItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("order_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(stSettleItem.orderDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettleItemDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettleItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettleItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<StSettleItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("orderId", stSettleItem.orderId),
            QdslUtil.FieldDef.like("orderItemId", stSettleItem.orderItemId),
            QdslUtil.FieldDef.like("prodId", stSettleItem.prodId),
            QdslUtil.FieldDef.like("settleId", stSettleItem.settleId),
            QdslUtil.FieldDef.like("settleItemId", stSettleItem.settleItemId),
            QdslUtil.FieldDef.like("settleItemTypeCd", stSettleItem.settleItemTypeCd),
            QdslUtil.FieldDef.like("vendorId", stSettleItem.vendorId)
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettleItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettleItem.settleItemId.eq(entity.getSettleItemId())).execute();
        return (int) affected;
    }
}
