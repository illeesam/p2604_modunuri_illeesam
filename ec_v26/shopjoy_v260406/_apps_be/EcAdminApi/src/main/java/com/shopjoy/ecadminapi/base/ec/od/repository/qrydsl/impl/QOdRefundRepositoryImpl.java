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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdRefund;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdRefundRepository;
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
/** OdRefund QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdRefundRepositoryImpl implements QOdRefundRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdRefundRepositoryImpl";
    private static final QOdRefund odRefund   = QOdRefund.odRefund;
    private static final QSySite   ste = new QSySite("ste");
    private static final QOdOrder  ord = new QOdOrder("ord");
    private static final QOdClaim  cla = new QOdClaim("cla");
    private static final QSyCode   cdRt = new QSyCode("cd_rt");
    private static final QSyCode   cdRs = new QSyCode("cd_rs");
    private static final QSyCode   cdCf = new QSyCode("cd_cf");

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdRefundDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdRefundDto.Item.class,
                        odRefund.refundId, odRefund.siteId, odRefund.orderId, odRefund.claimId,
                        odRefund.refundTypeCd,
                        odRefund.refundProdAmt, odRefund.refundCouponAmt, odRefund.refundShipAmt,
                        odRefund.refundSaveAmt, odRefund.refundCacheAmt, odRefund.totalRefundAmt,
                        odRefund.refundStatusCd, odRefund.refundStatusCdBefore,
                        odRefund.refundReqDate, odRefund.refundCompltDate,
                        odRefund.faultTypeCd, odRefund.refundReason, odRefund.memo,
                        odRefund.regBy, odRefund.regDate, odRefund.updBy, odRefund.updDate
                ))
                .from(odRefund)
                .leftJoin(ste).on(ste.siteId.eq(odRefund.siteId))
                .leftJoin(ord).on(ord.orderId.eq(odRefund.orderId))
                .leftJoin(cla).on(cla.claimId.eq(odRefund.claimId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("REFUND_TYPE").and(cdRt.codeValue.eq(odRefund.refundTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(odRefund.refundStatusCd)))
                .leftJoin(cdCf).on(cdCf.codeGrp.eq("CLAIM_FAULT").and(cdCf.codeValue.eq(odRefund.faultTypeCd)));
    }

    /* 환불 키조회 */
    @Override
    public Optional<OdRefundDto.Item> selectById(String refundId) {
        OdRefundDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odRefund.refundId.eq(refundId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 환불 목록조회 */
    @Override
    public List<OdRefundDto.Item> selectList(OdRefundDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andRefundIdEq(search),
                    andDateRangeBetween(search),
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

    /* 환불 페이지조회 */
    @Override
    public OdRefundDto.PageResponse selectPageData(OdRefundDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andRefundIdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdRefundDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdRefundDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odRefund.count())
                .where(wheres)
                .fetchOne();

        OdRefundDto.PageResponse res = new OdRefundDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }



    /* 환불 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(OdRefundDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odRefund.siteId.eq(search.getSiteId()) : null;
    }

    /* refundId 정확 일치 */
    private BooleanExpression andRefundIdEq(OdRefundDto.Request search) {
        return search != null && StringUtils.hasText(search.getRefundId())
                ? odRefund.refundId.eq(search.getRefundId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(OdRefundDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return odRefund.regDate.goe(start).and(odRefund.regDate.lt(endExcl));
            case "upd_date": return odRefund.updDate.goe(start).and(odRefund.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(OdRefundDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",claimId,", odRefund.claimId, pattern);
        or = orLike(or, all, types, ",faultTypeCd,", odRefund.faultTypeCd, pattern);
        or = orLike(or, all, types, ",memo,", odRefund.memo, pattern);
        or = orLike(or, all, types, ",orderId,", odRefund.orderId, pattern);
        or = orLike(or, all, types, ",refundId,", odRefund.refundId, pattern);
        or = orLike(or, all, types, ",refundReason,", odRefund.refundReason, pattern);
        or = orLike(or, all, types, ",refundStatusCd,", odRefund.refundStatusCd, pattern);
        or = orLike(or, all, types, ",refundStatusCdBefore,", odRefund.refundStatusCdBefore, pattern);
        or = orLike(or, all, types, ",refundTypeCd,", odRefund.refundTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", odRefund.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdRefundDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odRefund.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odRefund.refundId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("refundId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odRefund.refundId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odRefund.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odRefund.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odRefund.refundId));
        }
        return orders;
    }

    /* 환불 수정 */
    @Override
    public int updateSelective(OdRefund entity) {
        if (entity.getRefundId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odRefund);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(odRefund.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getOrderId()              != null) { update.set(odRefund.orderId,              entity.getOrderId());              hasAny = true; }
        if (entity.getClaimId()              != null) { update.set(odRefund.claimId,              entity.getClaimId());              hasAny = true; }
        if (entity.getRefundTypeCd()         != null) { update.set(odRefund.refundTypeCd,         entity.getRefundTypeCd());         hasAny = true; }
        if (entity.getRefundProdAmt()        != null) { update.set(odRefund.refundProdAmt,        entity.getRefundProdAmt());        hasAny = true; }
        if (entity.getRefundCouponAmt()      != null) { update.set(odRefund.refundCouponAmt,      entity.getRefundCouponAmt());      hasAny = true; }
        if (entity.getRefundShipAmt()        != null) { update.set(odRefund.refundShipAmt,        entity.getRefundShipAmt());        hasAny = true; }
        if (entity.getRefundSaveAmt()        != null) { update.set(odRefund.refundSaveAmt,        entity.getRefundSaveAmt());        hasAny = true; }
        if (entity.getRefundCacheAmt()       != null) { update.set(odRefund.refundCacheAmt,       entity.getRefundCacheAmt());       hasAny = true; }
        if (entity.getTotalRefundAmt()       != null) { update.set(odRefund.totalRefundAmt,       entity.getTotalRefundAmt());       hasAny = true; }
        if (entity.getRefundStatusCd()       != null) { update.set(odRefund.refundStatusCd,       entity.getRefundStatusCd());       hasAny = true; }
        if (entity.getRefundStatusCdBefore() != null) { update.set(odRefund.refundStatusCdBefore, entity.getRefundStatusCdBefore()); hasAny = true; }
        if (entity.getRefundReqDate()        != null) { update.set(odRefund.refundReqDate,        entity.getRefundReqDate());        hasAny = true; }
        if (entity.getRefundCompltDate()     != null) { update.set(odRefund.refundCompltDate,     entity.getRefundCompltDate());     hasAny = true; }
        if (entity.getFaultTypeCd()          != null) { update.set(odRefund.faultTypeCd,          entity.getFaultTypeCd());          hasAny = true; }
        if (entity.getRefundReason()         != null) { update.set(odRefund.refundReason,         entity.getRefundReason());         hasAny = true; }
        if (entity.getMemo()                 != null) { update.set(odRefund.memo,                 entity.getMemo());                 hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(odRefund.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odRefund.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odRefund.refundId.eq(entity.getRefundId())).execute();
        return (int) affected;
    }
}
