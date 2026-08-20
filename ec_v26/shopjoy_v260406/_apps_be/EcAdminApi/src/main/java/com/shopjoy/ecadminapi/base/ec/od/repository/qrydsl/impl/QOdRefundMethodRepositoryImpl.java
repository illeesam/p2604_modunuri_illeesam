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
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdPay;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdRefundMethodRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdRefundMethod(환불수단 내역 (수단별 환불금액 및 우선순위)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdRefundMethodRepositoryImpl implements QOdRefundMethodRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdRefundMethodRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdRefundMethod odRefundMethod   = QOdRefundMethod.odRefundMethod;
    private static final QSySite         ste = new QSySite("ste");
    private static final QOdOrder        ord = new QOdOrder("ord");
    private static final QOdPay          pay = new QOdPay("pay");
    private static final QVwSyCode         cdPm = new QVwSyCode("cd_pm");
    private static final QVwSyCode         cdRs = new QVwSyCode("cd_rs");    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * PAY_METHOD    {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
     * REFUND_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패}
     */
    private JPAQuery<OdRefundMethodDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdRefundMethodDto.Item.class,
                        odRefundMethod.refundMethodId,      // 환불수단ID (YYMMDDhhmmss+rand4)
                        odRefundMethod.refundId,              // 환불ID (od_refund.refund_id)
                        odRefundMethod.orderId,               // 주문ID (od_order.order_id)
                        odRefundMethod.payMethodCd,           // 결제수단코드 — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
                        odRefundMethod.refundPriority,        // 환불 우선순위 (1=카드·현금성 결제수단, 2=캐쉬, 3=적립금)
                        odRefundMethod.refundAmt,             // 해당 수단으로 환불할 금액
                        odRefundMethod.refundAvailAmt,        // 해당 수단 잔여 환불 가능금액 (원 결제액 - 기환불 누적액)
                        odRefundMethod.refundStatusCd,        // 수단별 환불상태 — REFUND_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패}
                        odRefundMethod.refundStatusCdBefore,  // 변경 전 환불상태 — REFUND_STATUS (동일 코드그룹)
                        odRefundMethod.refundDate,            // 해당 수단 환불 완료일시
                        odRefundMethod.payId,                  // 원 결제 레코드ID (od_pay.pay_id)
                        odRefundMethod.pgRefundId,            // PG 환불 거래ID
                        odRefundMethod.pgResponse,            // PG 환불 응답 JSON
                        odRefundMethod.regBy,      // 등록자
                        odRefundMethod.regDate,    // 등록일시
                        odRefundMethod.updBy,      // 수정자
                        odRefundMethod.updDate,    // 수정일시
                        odRefundMethod.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(odRefundMethod)
                .innerJoin(ord).on(ord.orderId.eq(odRefundMethod.orderId)) // 주문
                .innerJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(odRefundMethod.payMethodCd))) // 결제수단
                .leftJoin(pay).on(pay.payId.eq(odRefundMethod.payId)) // 결제
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS_CD").and(cdRs.codeValue.eq(odRefundMethod.refundStatusCd))) // 환불상태
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odRefundMethod.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odRefundMethod.regBy)) // 등록자
                ;
    }

    /* 환불수단 키조회 */
    @Override
    public Optional<OdRefundMethodDto.Item> selectById(String refundMethodId) {
        OdRefundMethodDto.Item dtl = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odRefundMethod.refundMethodId.eq(refundMethodId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 환불수단 목록조회 */
    @Override
    public List<OdRefundMethodDto.Item> selectList(OdRefundMethodDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odRefundMethod.refundMethodId, search.getRefundMethodId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odRefundMethod.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odRefundMethod.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdRefundMethodDto.Item> query = baseListQuery()
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
        List<OdRefundMethodDto.Item> list = query.fetch();
        return list;
    }

    /* 환불수단 페이지조회 */
    @Override
    public BasePage<OdRefundMethodDto.Item> selectPageData(OdRefundMethodDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odRefundMethod.refundMethodId, search.getRefundMethodId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odRefundMethod.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odRefundMethod.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<OdRefundMethodDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdRefundMethodDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odRefundMethod.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdRefundMethodDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("orderId", odRefundMethod.orderId),
            QdslUtil.FieldDef.like("payId", odRefundMethod.payId),
            QdslUtil.FieldDef.like("payMethodCd", odRefundMethod.payMethodCd),
            QdslUtil.FieldDef.like("pgRefundId", odRefundMethod.pgRefundId),
            QdslUtil.FieldDef.like("pgResponse", odRefundMethod.pgResponse),
            QdslUtil.FieldDef.like("refundId", odRefundMethod.refundId),
            QdslUtil.FieldDef.like("refundMethodId", odRefundMethod.refundMethodId),
            QdslUtil.FieldDef.like("refundStatusCd", odRefundMethod.refundStatusCd),
            QdslUtil.FieldDef.like("refundStatusCdBefore", odRefundMethod.refundStatusCdBefore)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("refundMethodId", odRefundMethod.refundMethodId,
                   "regDate", odRefundMethod.regDate),
        new OrderSpecifier<>(Order.DESC, odRefundMethod.regDate),
        new OrderSpecifier<>(Order.ASC, odRefundMethod.refundMethodId));
    }

    /* 환불수단 수정 */
    @Override
    public int updateSelective(OdRefundMethod entity) {
        if (entity.getRefundMethodId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odRefundMethod);
        boolean hasAny = false;

        if (entity.getRefundId()             != null) { update.set(odRefundMethod.refundId,             entity.getRefundId());             hasAny = true; }
        if (entity.getOrderId()              != null) { update.set(odRefundMethod.orderId,              entity.getOrderId());              hasAny = true; }
        if (entity.getPayMethodCd()          != null) { update.set(odRefundMethod.payMethodCd,          entity.getPayMethodCd());          hasAny = true; }
        if (entity.getRefundPriority()       != null) { update.set(odRefundMethod.refundPriority,       entity.getRefundPriority());       hasAny = true; }
        if (entity.getRefundAmt()            != null) { update.set(odRefundMethod.refundAmt,            entity.getRefundAmt());            hasAny = true; }
        if (entity.getRefundAvailAmt()       != null) { update.set(odRefundMethod.refundAvailAmt,       entity.getRefundAvailAmt());       hasAny = true; }
        if (entity.getRefundStatusCd()       != null) { update.set(odRefundMethod.refundStatusCd,       entity.getRefundStatusCd());       hasAny = true; }
        if (entity.getRefundStatusCdBefore() != null) { update.set(odRefundMethod.refundStatusCdBefore, entity.getRefundStatusCdBefore()); hasAny = true; }
        if (entity.getRefundDate()           != null) { update.set(odRefundMethod.refundDate,           entity.getRefundDate());           hasAny = true; }
        if (entity.getPayId()                != null) { update.set(odRefundMethod.payId,                entity.getPayId());                hasAny = true; }
        if (entity.getPgRefundId()           != null) { update.set(odRefundMethod.pgRefundId,           entity.getPgRefundId());           hasAny = true; }
        if (entity.getPgResponse()           != null) { update.set(odRefundMethod.pgResponse,           entity.getPgResponse());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(odRefundMethod.updBy,                entity.getUpdBy());                hasAny = true; }
        update.set(odRefundMethod.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odRefundMethod.refundMethodId.eq(entity.getRefundMethodId())).execute();
        return (int) affected;
    }
}
