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
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdPay;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdRefundMethodRepository;
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
/** OdRefundMethod QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdRefundMethodRepositoryImpl implements QOdRefundMethodRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdRefundMethodRepositoryImpl";
    private static final QOdRefundMethod odRefundMethod   = QOdRefundMethod.odRefundMethod;
    private static final QSySite         ste = new QSySite("ste");
    private static final QOdOrder        ord = new QOdOrder("ord");
    private static final QOdPay          pay = new QOdPay("pay");
    private static final QSyCode         cdPm = new QSyCode("cd_pm");
    private static final QSyCode         cdRs = new QSyCode("cd_rs");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", odRefundMethod.regDate,
        "upd_date", odRefundMethod.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("orderId", odRefundMethod.orderId),
        Map.entry("payId", odRefundMethod.payId),
        Map.entry("payMethodCd", odRefundMethod.payMethodCd),
        Map.entry("pgRefundId", odRefundMethod.pgRefundId),
        Map.entry("pgResponse", odRefundMethod.pgResponse),
        Map.entry("refundId", odRefundMethod.refundId),
        Map.entry("refundMethodId", odRefundMethod.refundMethodId),
        Map.entry("refundStatusCd", odRefundMethod.refundStatusCd),
        Map.entry("refundStatusCdBefore", odRefundMethod.refundStatusCdBefore),
        Map.entry("siteId", odRefundMethod.siteId)
    );

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdRefundMethodDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdRefundMethodDto.Item.class,
                        odRefundMethod.refundMethodId, odRefundMethod.siteId, odRefundMethod.refundId, odRefundMethod.orderId,
                        odRefundMethod.payMethodCd, odRefundMethod.refundPriority, odRefundMethod.refundAmt, odRefundMethod.refundAvailAmt,
                        odRefundMethod.refundStatusCd, odRefundMethod.refundStatusCdBefore, odRefundMethod.refundDate,
                        odRefundMethod.payId, odRefundMethod.pgRefundId, odRefundMethod.pgResponse,
                        odRefundMethod.regBy, odRefundMethod.regDate, odRefundMethod.updBy, odRefundMethod.updDate
                ))
                .from(odRefundMethod)
                .leftJoin(ste).on(ste.siteId.eq(odRefundMethod.siteId))
                .leftJoin(ord).on(ord.orderId.eq(odRefundMethod.orderId))
                .leftJoin(pay).on(pay.payId.eq(odRefundMethod.payId))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(odRefundMethod.payMethodCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(odRefundMethod.refundStatusCd)));
    }

    /* 환불수단 키조회 */
    @Override
    public Optional<OdRefundMethodDto.Item> selectById(String refundMethodId) {
        OdRefundMethodDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odRefundMethod.refundMethodId.eq(refundMethodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 환불수단 목록조회 */
    @Override
    public List<OdRefundMethodDto.Item> selectList(OdRefundMethodDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundMethodDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odRefundMethod.siteId, search.getSiteId()),
                    QdslUtil.strEq(odRefundMethod.refundMethodId, search.getRefundMethodId()),
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

    /* 환불수단 페이지조회 */
    @Override
    public OdRefundMethodDto.PageResponse selectPageData(OdRefundMethodDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odRefundMethod.siteId, search.getSiteId()),
                QdslUtil.strEq(odRefundMethod.refundMethodId, search.getRefundMethodId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdRefundMethodDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdRefundMethodDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odRefundMethod.count())
                .where(wheres)
                .fetchOne();

        OdRefundMethodDto.PageResponse res = new OdRefundMethodDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdRefundMethodDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdRefundMethodDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odRefundMethod.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odRefundMethod.refundMethodId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("refundMethodId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odRefundMethod.refundMethodId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odRefundMethod.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odRefundMethod.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odRefundMethod.refundMethodId));
        }
        return orders;
    }

    /* 환불수단 수정 */
    @Override
    public int updateSelective(OdRefundMethod entity) {
        if (entity.getRefundMethodId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odRefundMethod);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(odRefundMethod.siteId,               entity.getSiteId());               hasAny = true; }
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odRefundMethod.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odRefundMethod.refundMethodId.eq(entity.getRefundMethodId())).execute();
        return (int) affected;
    }
}
