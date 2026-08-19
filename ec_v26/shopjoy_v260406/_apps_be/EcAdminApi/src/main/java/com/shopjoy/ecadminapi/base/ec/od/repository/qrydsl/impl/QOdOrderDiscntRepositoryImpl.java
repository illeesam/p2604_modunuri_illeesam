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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderDiscntRepository;
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
/** OdOrderDiscnt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderDiscntRepositoryImpl implements QOdOrderDiscntRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdOrderDiscntRepositoryImpl";
    private static final QOdOrderDiscnt odOrderDiscnt   = QOdOrderDiscnt.odOrderDiscnt;
    private static final QSySite        ste = new QSySite("ste");
    private static final QOdOrder       ord = new QOdOrder("ord");
    private static final QPmCoupon      cpn = new QPmCoupon("cpn");
    private static final QVwSyCode        cdOdt = new QVwSyCode("cd_odt");    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * ORDER_DISCNT_TYPE  {SALE_PRICE:판매가할인, PAY_DISCNT:결제할인, COUPON:쿠폰할인, PROMOTION:프로모션할인, SHIP_DISCNT:배송비할인, PRODUCT_DISCNT:상품할인, CLAIM_SHIP:클레임배송비할인}
     */
    private JPAQuery<OdOrderDiscntDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDiscntDto.Item.class,
                        odOrderDiscnt.orderDiscntId,  // 주문할인ID (YYMMDDhhmmss+rand4)
                        odOrderDiscnt.orderId,         // 주문ID (od_order.order_id)
                        odOrderDiscnt.discntTypeCd,    // 할인유형코드 — ORDER_DISCNT_TYPE {SALE_PRICE:판매가할인, PAY_DISCNT:결제할인, COUPON:쿠폰할인, PROMOTION:프로모션할인, SHIP_DISCNT:배송비할인, PRODUCT_DISCNT:상품할인, CLAIM_SHIP:클레임배송비할인}
                        odOrderDiscnt.couponId,        // 쿠폰ID (pm_coupon.coupon_id — ORDER_COUPON인 경우)
                        odOrderDiscnt.couponIssueId,   // 쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ORDER_COUPON인 경우)
                        odOrderDiscnt.discntRate,      // 할인율 (% — 비율할인인 경우)
                        odOrderDiscnt.discntAmt,       // 할인·차감 금액
                        odOrderDiscnt.baseItemAmt,     // 안분 기준 상품금액 (주문쿠폰 안분 계산용 — 쿠폰 적용 대상 items 합계)
                        odOrderDiscnt.restoreYn,       // 복원여부 Y/N (환불 시 적립금·캐쉬 차감 복원 완료 여부)
                        odOrderDiscnt.restoreAmt,      // 복원된 금액 (부분반품 시 부분복원 지원)
                        odOrderDiscnt.restoreDate,     // 복원 처리일시
                        odOrderDiscnt.regBy, odOrderDiscnt.regDate
                ))
                .from(odOrderDiscnt)
                .leftJoin(ord).on(ord.orderId.eq(odOrderDiscnt.orderId))
                .leftJoin(cpn).on(cpn.couponId.eq(odOrderDiscnt.couponId))
                .leftJoin(cdOdt).on(cdOdt.codeGrp.eq("ORDER_DISCNT_TYPE").and(cdOdt.codeValue.eq(odOrderDiscnt.discntTypeCd)));
    }

    /* 주문 할인 키조회 */
    @Override
    public Optional<OdOrderDiscntDto.Item> selectById(String orderDiscntId) {
        OdOrderDiscntDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odOrderDiscnt.orderDiscntId.eq(orderDiscntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 할인 목록조회 */
    @Override
    public List<OdOrderDiscntDto.Item> selectList(OdOrderDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strIn(odOrderDiscnt.orderId, search.getOrderIds()));
        wheres.add(QdslUtil.strEq(odOrderDiscnt.orderId, search.getOrderId()));
        wheres.add(QdslUtil.strEq(odOrderDiscnt.orderDiscntId, search.getOrderDiscntId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(odOrderDiscnt.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(odOrderDiscnt.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdOrderDiscntDto.Item> query = baseListQuery()
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

    /* 주문 할인 페이지조회 */
    @Override
    public BasePage<OdOrderDiscntDto.Item> selectPageData(OdOrderDiscntDto.Request search) {
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
        whereList.add(QdslUtil.strIn(odOrderDiscnt.orderId, search.getOrderIds()));
        whereList.add(QdslUtil.strEq(odOrderDiscnt.orderId, search.getOrderId()));
        whereList.add(QdslUtil.strEq(odOrderDiscnt.orderDiscntId, search.getOrderDiscntId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(odOrderDiscnt.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(odOrderDiscnt.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdOrderDiscntDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdOrderDiscntDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odOrderDiscnt.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdOrderDiscntDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("couponId", odOrderDiscnt.couponId),
            QdslUtil.FieldDef.like("couponIssueId", odOrderDiscnt.couponIssueId),
            QdslUtil.FieldDef.like("discntTypeCd", odOrderDiscnt.discntTypeCd),
            QdslUtil.FieldDef.like("orderDiscntId", odOrderDiscnt.orderDiscntId),
            QdslUtil.FieldDef.like("orderId", odOrderDiscnt.orderId),
            QdslUtil.FieldDef.like("restoreYn", odOrderDiscnt.restoreYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("orderDiscntId", odOrderDiscnt.orderDiscntId,
                   "regDate", odOrderDiscnt.regDate),
        new OrderSpecifier<>(Order.DESC, odOrderDiscnt.regDate),
        new OrderSpecifier<>(Order.ASC, odOrderDiscnt.orderDiscntId));
    }

    /* 주문 할인 수정 */
    @Override
    public int updateSelective(OdOrderDiscnt entity) {
        if (entity.getOrderDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odOrderDiscnt);
        boolean hasAny = false;

        if (entity.getOrderId()       != null) { update.set(odOrderDiscnt.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getDiscntTypeCd()  != null) { update.set(odOrderDiscnt.discntTypeCd,  entity.getDiscntTypeCd());  hasAny = true; }
        if (entity.getCouponId()      != null) { update.set(odOrderDiscnt.couponId,      entity.getCouponId());      hasAny = true; }
        if (entity.getCouponIssueId() != null) { update.set(odOrderDiscnt.couponIssueId, entity.getCouponIssueId()); hasAny = true; }
        if (entity.getDiscntRate()    != null) { update.set(odOrderDiscnt.discntRate,    entity.getDiscntRate());    hasAny = true; }
        if (entity.getDiscntAmt()     != null) { update.set(odOrderDiscnt.discntAmt,     entity.getDiscntAmt());     hasAny = true; }
        if (entity.getBaseItemAmt()   != null) { update.set(odOrderDiscnt.baseItemAmt,   entity.getBaseItemAmt());   hasAny = true; }
        if (entity.getRestoreYn()     != null) { update.set(odOrderDiscnt.restoreYn,     entity.getRestoreYn());     hasAny = true; }
        if (entity.getRestoreAmt()    != null) { update.set(odOrderDiscnt.restoreAmt,    entity.getRestoreAmt());    hasAny = true; }
        if (entity.getRestoreDate()   != null) { update.set(odOrderDiscnt.restoreDate,   entity.getRestoreDate());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(odOrderDiscnt.orderDiscntId.eq(entity.getOrderDiscntId())).execute();
        return (int) affected;
    }
}
