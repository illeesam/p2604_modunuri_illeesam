package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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

    /* 환불수단 키조회 */
    @Override
    public Optional<OdRefundMethodDto.Item> selectById(String refundMethodId) {
        OdRefundMethodDto.Item dto = baseListQuery()
                .where(odRefundMethod.refundMethodId.eq(refundMethodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 환불수단 목록조회 */
    @Override
    public List<OdRefundMethodDto.Item> selectList(OdRefundMethodDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundMethodDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndRefundMethodId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 환불수단 페이지조회 */
    @Override
    public OdRefundMethodDto.PageResponse selectPageData(OdRefundMethodDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndRefundMethodId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<OdRefundMethodDto.Item> query = baseListQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdRefundMethodDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(odRefundMethod.count())
                .from(odRefundMethod)
                .where(wheres)
                .fetchOne();

        OdRefundMethodDto.PageResponse res = new OdRefundMethodDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

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

    /* 환불수단 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdRefundMethodDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odRefundMethod.siteId.eq(search.getSiteId()) : null;
    }

    /* refundMethodId 정확 일치 */
    private BooleanExpression baseAndRefundMethodId(OdRefundMethodDto.Request search) {
        return search != null && StringUtils.hasText(search.getRefundMethodId())
                ? odRefundMethod.refundMethodId.eq(search.getRefundMethodId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdRefundMethodDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return odRefundMethod.regDate.goe(start).and(odRefundMethod.regDate.lt(endExcl));
            case "upd_date": return odRefundMethod.updDate.goe(start).and(odRefundMethod.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdRefundMethodDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",orderId,", odRefundMethod.orderId, pattern);
        or = orLike(or, all, types, ",payId,", odRefundMethod.payId, pattern);
        or = orLike(or, all, types, ",payMethodCd,", odRefundMethod.payMethodCd, pattern);
        or = orLike(or, all, types, ",pgRefundId,", odRefundMethod.pgRefundId, pattern);
        or = orLike(or, all, types, ",pgResponse,", odRefundMethod.pgResponse, pattern);
        or = orLike(or, all, types, ",refundId,", odRefundMethod.refundId, pattern);
        or = orLike(or, all, types, ",refundMethodId,", odRefundMethod.refundMethodId, pattern);
        or = orLike(or, all, types, ",refundStatusCd,", odRefundMethod.refundStatusCd, pattern);
        or = orLike(or, all, types, ",refundStatusCdBefore,", odRefundMethod.refundStatusCdBefore, pattern);
        or = orLike(or, all, types, ",siteId,", odRefundMethod.siteId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
