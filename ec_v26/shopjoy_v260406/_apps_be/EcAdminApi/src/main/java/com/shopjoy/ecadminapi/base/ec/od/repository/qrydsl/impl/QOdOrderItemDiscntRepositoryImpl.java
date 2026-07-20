package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderItemDiscntRepository;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
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
/** OdOrderItemDiscnt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderItemDiscntRepositoryImpl implements QOdOrderItemDiscntRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdOrderItemDiscntRepositoryImpl";
    private static final QOdOrderItemDiscnt odOrderItemDiscnt   = QOdOrderItemDiscnt.odOrderItemDiscnt;
    private static final QSySite            ste = new QSySite("ste");
    private static final QOdOrder           ord = new QOdOrder("ord");
    private static final QOdOrderItem       ite = new QOdOrderItem("ite");
    private static final QPmCoupon          cpn = new QPmCoupon("cpn");
    private static final QSyCode            cdOidt = new QSyCode("cd_oidt");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", odOrderItemDiscnt.regDate,
        "upd_date", odOrderItemDiscnt.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("couponId", odOrderItemDiscnt.couponId),
        Map.entry("couponIssueId", odOrderItemDiscnt.couponIssueId),
        Map.entry("discntTypeCd", odOrderItemDiscnt.discntTypeCd),
        Map.entry("itemDiscntId", odOrderItemDiscnt.itemDiscntId),
        Map.entry("orderId", odOrderItemDiscnt.orderId),
        Map.entry("orderItemId", odOrderItemDiscnt.orderItemId),
        Map.entry("siteId", odOrderItemDiscnt.siteId)
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * ORDER_ITEM_DISCNT_TYPE (sy_code 미등록 — Entity 주석 기준 예시)
     *   ITEM_DISCNT:즉시할인, ITEM_COUPON:상품쿠폰
     */
    private JPAQuery<OdOrderItemDiscntDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderItemDiscntDto.Item.class,
                        odOrderItemDiscnt.itemDiscntId,    // 주문상품할인ID (YYMMDDhhmmss+rand4)
                        odOrderItemDiscnt.siteId,           // 사이트ID
                        odOrderItemDiscnt.orderId,          // 주문ID (od_order.order_id)
                        odOrderItemDiscnt.orderItemId,      // 주문상품ID (od_order_item.order_item_id)
                        odOrderItemDiscnt.discntTypeCd,     // 할인유형코드 — ORDER_ITEM_DISCNT_TYPE {ITEM_DISCNT:즉시할인, ITEM_COUPON:상품쿠폰}
                        odOrderItemDiscnt.couponId,         // 쿠폰ID (pm_coupon.coupon_id — ITEM_COUPON인 경우)
                        odOrderItemDiscnt.couponIssueId,    // 쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ITEM_COUPON인 경우)
                        odOrderItemDiscnt.discntRate,       // 할인율 (% — 비율할인인 경우)
                        odOrderItemDiscnt.unitDiscntAmt,    // 1개당 할인금액
                        odOrderItemDiscnt.totalDiscntAmt,   // 전체 할인금액 (unit_discnt_amt × order_qty)
                        odOrderItemDiscnt.orderQty,         // 주문수량 스냅샷
                        odOrderItemDiscnt.regBy, odOrderItemDiscnt.regDate
                ))
                .from(odOrderItemDiscnt)
                .leftJoin(ste).on(ste.siteId.eq(odOrderItemDiscnt.siteId))
                .leftJoin(ord).on(ord.orderId.eq(odOrderItemDiscnt.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(odOrderItemDiscnt.orderItemId))
                .leftJoin(cpn).on(cpn.couponId.eq(odOrderItemDiscnt.couponId))
                .leftJoin(cdOidt).on(cdOidt.codeGrp.eq("ORDER_ITEM_DISCNT_TYPE").and(cdOidt.codeValue.eq(odOrderItemDiscnt.discntTypeCd)));
    }

    /* 주문 아이템 할인 키조회 */
    @Override
    public Optional<OdOrderItemDiscntDto.Item> selectById(String itemDiscntId) {
        OdOrderItemDiscntDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odOrderItemDiscnt.itemDiscntId.eq(itemDiscntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 아이템 할인 목록조회 */
    @Override
    public List<OdOrderItemDiscntDto.Item> selectList(OdOrderItemDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderItemDiscntDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odOrderItemDiscnt.siteId, search.getSiteId()),
                    QdslUtil.strEq(odOrderItemDiscnt.itemDiscntId, search.getItemDiscntId()),
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

    /* 주문 아이템 할인 페이지조회 */
    @Override
    public OdOrderItemDiscntDto.PageResponse selectPageData(OdOrderItemDiscntDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odOrderItemDiscnt.siteId, search.getSiteId()),
                QdslUtil.strEq(odOrderItemDiscnt.itemDiscntId, search.getItemDiscntId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdOrderItemDiscntDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdOrderItemDiscntDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odOrderItemDiscnt.count())
                .where(wheres)
                .fetchOne();

        OdOrderItemDiscntDto.PageResponse res = new OdOrderItemDiscntDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdOrderItemDiscntDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdOrderItemDiscntDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odOrderItemDiscnt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrderItemDiscnt.itemDiscntId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("itemDiscntId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odOrderItemDiscnt.itemDiscntId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odOrderItemDiscnt.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odOrderItemDiscnt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrderItemDiscnt.itemDiscntId));
        }
        return orders;
    }

    /* 주문 아이템 할인 수정 */
    @Override
    public int updateSelective(OdOrderItemDiscnt entity) {
        if (entity.getItemDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odOrderItemDiscnt);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(odOrderItemDiscnt.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getOrderId()        != null) { update.set(odOrderItemDiscnt.orderId,        entity.getOrderId());        hasAny = true; }
        if (entity.getOrderItemId()    != null) { update.set(odOrderItemDiscnt.orderItemId,    entity.getOrderItemId());    hasAny = true; }
        if (entity.getDiscntTypeCd()   != null) { update.set(odOrderItemDiscnt.discntTypeCd,   entity.getDiscntTypeCd());   hasAny = true; }
        if (entity.getCouponId()       != null) { update.set(odOrderItemDiscnt.couponId,       entity.getCouponId());       hasAny = true; }
        if (entity.getCouponIssueId()  != null) { update.set(odOrderItemDiscnt.couponIssueId,  entity.getCouponIssueId());  hasAny = true; }
        if (entity.getDiscntRate()     != null) { update.set(odOrderItemDiscnt.discntRate,     entity.getDiscntRate());     hasAny = true; }
        if (entity.getUnitDiscntAmt()  != null) { update.set(odOrderItemDiscnt.unitDiscntAmt,  entity.getUnitDiscntAmt());  hasAny = true; }
        if (entity.getTotalDiscntAmt() != null) { update.set(odOrderItemDiscnt.totalDiscntAmt, entity.getTotalDiscntAmt()); hasAny = true; }
        if (entity.getOrderQty()       != null) { update.set(odOrderItemDiscnt.orderQty,       entity.getOrderQty());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(odOrderItemDiscnt.itemDiscntId.eq(entity.getItemDiscntId())).execute();
        return (int) affected;
    }
}
