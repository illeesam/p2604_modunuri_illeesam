package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderItemDiscntRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdOrderItemDiscnt(주문상품할인 내역 (즉시할인·상품쿠폰)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderItemDiscntRepositoryImpl implements QOdOrderItemDiscntRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdOrderItemDiscntRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdOrderItemDiscnt odOrderItemDiscnt   = QOdOrderItemDiscnt.odOrderItemDiscnt;
    private static final QSySite            ste = new QSySite("ste");
    private static final QOdOrder           ord = new QOdOrder("ord");
    private static final QOdOrderItem       ite = new QOdOrderItem("ite");
    private static final QPmCoupon          cpn = new QPmCoupon("cpn");
    private static final QVwSyCode            codeDiscntTypeCd = new QVwSyCode("cd_oidt");    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * ORDER_ITEM_DISCNT_TYPE (sy_code 미등록 — Entity 주석 기준 예시)
     *   ITEM_DISCNT:즉시할인, ITEM_COUPON:상품쿠폰
     */
    private JPAQuery<OdOrderItemDiscntDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderItemDiscntDto.Item.class,
                        odOrderItemDiscnt.orderItemDiscntId,    // 주문상품할인ID (YYMMDDhhmmss+rand4)
                        odOrderItemDiscnt.orderId,          // 주문ID (od_order.order_id)
                        odOrderItemDiscnt.orderItemId,      // 주문상품ID (od_order_item.order_item_id)
                        odOrderItemDiscnt.discntTypeCd,     // 할인유형코드 — ORDER_ITEM_DISCNT_TYPE {ITEM_DISCNT:즉시할인, ITEM_COUPON:상품쿠폰}
                        codeDiscntTypeCd.codeLabel.as("discntTypeCdNm"), // 코드 라벨
                        odOrderItemDiscnt.couponId,         // 쿠폰ID (pm_coupon.coupon_id — ITEM_COUPON인 경우)
                        odOrderItemDiscnt.couponIssueId,    // 쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ITEM_COUPON인 경우)
                        odOrderItemDiscnt.discntRate,       // 할인율 (% — 비율할인인 경우)
                        odOrderItemDiscnt.unitDiscntAmt,    // 1개당 할인금액
                        odOrderItemDiscnt.totalDiscntAmt,   // 전체 할인금액 (unit_discnt_amt × order_qty)
                        odOrderItemDiscnt.orderQty,         // 주문수량 스냅샷
                        odOrderItemDiscnt.regBy,  // 등록자
                        odOrderItemDiscnt.regDate,  // 등록일시
                        odOrderItemDiscnt.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(odOrderItemDiscnt)
                .innerJoin(ord).on(ord.orderId.eq(odOrderItemDiscnt.orderId)) // 주문
                .innerJoin(ite).on(ite.orderItemId.eq(odOrderItemDiscnt.orderItemId)) // 주문상품
                .innerJoin(codeDiscntTypeCd).on(codeDiscntTypeCd.codeGrp.eq("ORDER_ITEM_DISCNT_TYPE").and(codeDiscntTypeCd.codeValue.eq(odOrderItemDiscnt.discntTypeCd))) // 주문상품할인유형
                .leftJoin(cpn).on(cpn.couponId.eq(odOrderItemDiscnt.couponId)) // 쿠폰
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odOrderItemDiscnt.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odOrderItemDiscnt.regBy)) // 등록자
                ;
    }

    /* 주문 아이템 할인 키조회 */
    @Override
    public Optional<OdOrderItemDiscntDto.Item> selectById(String orderItemDiscntId) {
        OdOrderItemDiscntDto.Item dtl = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odOrderItemDiscnt.orderItemDiscntId.eq(orderItemDiscntId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 주문 아이템 할인 목록조회 */
    @Override
    public List<OdOrderItemDiscntDto.Item> selectList(OdOrderItemDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odOrderItemDiscnt.orderItemDiscntId, search.getOrderItemDiscntId())); // 주문상품할인ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrderItemDiscnt.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrderItemDiscnt.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdOrderItemDiscntDto.Item> query = baseListQuery()
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
        List<OdOrderItemDiscntDto.Item> list = query.fetch();
        return list;
    }

    /* 주문 아이템 할인 페이지조회 */
    @Override
    public BasePage<OdOrderItemDiscntDto.Item> selectPageData(OdOrderItemDiscntDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odOrderItemDiscnt.orderItemDiscntId, search.getOrderItemDiscntId())); // 주문상품할인ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrderItemDiscnt.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrderItemDiscnt.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<OdOrderItemDiscntDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdOrderItemDiscntDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odOrderItemDiscnt.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdOrderItemDiscntDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "couponId,couponIssueId,discntTypeCd,orderItemDiscntId,orderId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("couponId", odOrderItemDiscnt.couponId), // 쿠폰ID (pm_coupon.coupon_id — ITEM_COUPON인 경우)
            QdslUtil.FieldDef.like("couponIssueId", odOrderItemDiscnt.couponIssueId), // 쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ITEM_COUPON인 경우)
            QdslUtil.FieldDef.like("discntTypeCd", odOrderItemDiscnt.discntTypeCd), // 할인유형코드
            QdslUtil.FieldDef.like("orderItemDiscntId", odOrderItemDiscnt.orderItemDiscntId), // 주문상품할인ID 필터
            QdslUtil.FieldDef.like("orderId", odOrderItemDiscnt.orderId), // 주문ID (od_order.order_id)
            QdslUtil.FieldDef.like("orderItemId", odOrderItemDiscnt.orderItemId) // 주문상품ID (od_order_item.order_item_id)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("orderItemDiscntId", odOrderItemDiscnt.orderItemDiscntId,
                   "regDate", odOrderItemDiscnt.regDate),
        new OrderSpecifier<>(Order.DESC, odOrderItemDiscnt.regDate),
        new OrderSpecifier<>(Order.ASC, odOrderItemDiscnt.orderItemDiscntId));
    }

    /* 주문 아이템 할인 수정 */
    @Override
    public int updateSelective(OdOrderItemDiscnt entity) {
        if (entity.getOrderItemDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odOrderItemDiscnt);
        boolean hasAny = false;

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

        long affected = update.where(odOrderItemDiscnt.orderItemDiscntId.eq(entity.getOrderItemDiscntId())).execute();
        return (int) affected;
    }
}
