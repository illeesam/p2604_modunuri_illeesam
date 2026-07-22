package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final QSyCode       cdSit = new QSyCode("cd_sit");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "order_date", stSettleItem.orderDate,
        "reg_date", stSettleItem.regDate,
        "upd_date", stSettleItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("orderId", stSettleItem.orderId),
        Map.entry("orderItemId", stSettleItem.orderItemId),
        Map.entry("prodId", stSettleItem.prodId),
        Map.entry("settleId", stSettleItem.settleId),
        Map.entry("settleItemId", stSettleItem.settleItemId),
        Map.entry("settleItemTypeCd", stSettleItem.settleItemTypeCd),
        Map.entry("siteId", stSettleItem.siteId),
        Map.entry("vendorId", stSettleItem.vendorId)
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * SETTLE_ITEM_TYPE  {SALE: '판매', CANCEL: '취소/반품', DISCNT: '할인분담', GIFT: '사은품분담', SHIP: '배송비', ADJ: '조정'}
     * (Entity 주석상 SALE/CANCEL/RETURN — sy_code 실 데이터에는 CANCEL 하나로 취소/반품 통합 + DISCNT/GIFT/SHIP/ADJ 추가 존재)
     */
    private JPAQuery<StSettleItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleItemDto.Item.class,
                        stSettleItem.settleItemId,       // 정산항목ID (PK)
                        stSettleItem.settleId,            // 정산ID (st_settle.settle_id)
                        stSettleItem.siteId,               // 사이트ID
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
                        sySite.siteNm.as("siteNm"),                         // 사이트명 (조인)
                        cdSit.codeLabel.as("settleItemTypeCdNm")            // 항목유형명 (sy_code 조인)
                ))
                .from(stSettleItem)
                .leftJoin(odOrder).on(odOrder.orderId.eq(stSettleItem.orderId))
                .leftJoin(odOrderItem).on(odOrderItem.orderItemId.eq(stSettleItem.orderItemId))
                .leftJoin(sySite).on(sySite.siteId.eq(stSettleItem.siteId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SETTLE_ITEM_TYPE").and(cdSit.codeValue.eq(stSettleItem.settleItemTypeCd)));
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleItemDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stSettleItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(stSettleItem.settleItemId, search.getSettleItemId()),
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

    /* 정산 항목 페이지조회 */
    @Override
    public StSettleItemDto.PageResponse selectPageData(StSettleItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stSettleItem.siteId, search.getSiteId()),
                QdslUtil.strEq(stSettleItem.settleItemId, search.getSettleItemId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

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

        StSettleItemDto.PageResponse res = new StSettleItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(StSettleItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleItemDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stSettleItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleItem.settleItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleItem.settleItemId));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleItem.orderDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettleItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleItem.settleItemId));
        }
        return orders;
    }

    /* 정산 항목 수정 */
    @Override
    public int updateSelective(StSettleItem entity) {
        if (entity.getSettleItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleItem);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(stSettleItem.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(stSettleItem.siteId,           entity.getSiteId());           hasAny = true; }
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
