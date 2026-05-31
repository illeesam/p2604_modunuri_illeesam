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
    private static final QOdRefund r   = QOdRefund.odRefund;
    private static final QSySite   ste = new QSySite("ste");
    private static final QOdOrder  ord = new QOdOrder("ord");
    private static final QOdClaim  cla = new QOdClaim("cla");
    private static final QSyCode   cdRt = new QSyCode("cd_rt");
    private static final QSyCode   cdRs = new QSyCode("cd_rs");
    private static final QSyCode   cdCf = new QSyCode("cd_cf");

    /* 환불 키조회 */
    @Override
    public Optional<OdRefundDto.Item> selectById(String refundId) {
        OdRefundDto.Item dto = baseListQuery()
                .where(r.refundId.eq(refundId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 환불 목록조회 */
    @Override
    public List<OdRefundDto.Item> selectList(OdRefundDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andRefundId(search),
                andDateRange(search),
                andSearchValue(search)
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

    /* 환불 페이지조회 */
    @Override
    public OdRefundDto.PageResponse selectPageList(OdRefundDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andRefundId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdRefundDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(r.count())
                .from(r)
                .where(
                andSiteId(search),
                andRefundId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        OdRefundDto.PageResponse res = new OdRefundDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdRefundDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdRefundDto.Item.class,
                        r.refundId, r.siteId, r.orderId, r.claimId,
                        r.refundTypeCd,
                        r.refundProdAmt, r.refundCouponAmt, r.refundShipAmt,
                        r.refundSaveAmt, r.refundCacheAmt, r.totalRefundAmt,
                        r.refundStatusCd, r.refundStatusCdBefore,
                        r.refundReqDate, r.refundCompltDate,
                        r.faultTypeCd, r.refundReason, r.memo,
                        r.regBy, r.regDate, r.updBy, r.updDate
                ))
                .from(r)
                .leftJoin(ste).on(ste.siteId.eq(r.siteId))
                .leftJoin(ord).on(ord.orderId.eq(r.orderId))
                .leftJoin(cla).on(cla.claimId.eq(r.claimId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("REFUND_TYPE").and(cdRt.codeValue.eq(r.refundTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(r.refundStatusCd)))
                .leftJoin(cdCf).on(cdCf.codeGrp.eq("CLAIM_FAULT").and(cdCf.codeValue.eq(r.faultTypeCd)));
    }

    /* 환불 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdRefundDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? r.siteId.eq(search.getSiteId()) : null;
    }

    /* refundId 정확 일치 */
    private BooleanExpression andRefundId(OdRefundDto.Request search) {
        return search != null && StringUtils.hasText(search.getRefundId())
                ? r.refundId.eq(search.getRefundId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(OdRefundDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return r.regDate.goe(start).and(r.regDate.lt(endExcl));
            case "upd_date": return r.updDate.goe(start).and(r.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdRefundDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",claimId,", r.claimId, pattern);
        or = orLike(or, all, types, ",faultTypeCd,", r.faultTypeCd, pattern);
        or = orLike(or, all, types, ",memo,", r.memo, pattern);
        or = orLike(or, all, types, ",orderId,", r.orderId, pattern);
        or = orLike(or, all, types, ",refundId,", r.refundId, pattern);
        or = orLike(or, all, types, ",refundReason,", r.refundReason, pattern);
        or = orLike(or, all, types, ",refundStatusCd,", r.refundStatusCd, pattern);
        or = orLike(or, all, types, ",refundStatusCdBefore,", r.refundStatusCdBefore, pattern);
        or = orLike(or, all, types, ",refundTypeCd,", r.refundTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", r.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.refundId));
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
                    orders.add(new OrderSpecifier(order, r.refundId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.refundId));
        }
        return orders;
    }

    /* 환불 수정 */
    @Override
    public int updateSelective(OdRefund entity) {
        if (entity.getRefundId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(r.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getOrderId()              != null) { update.set(r.orderId,              entity.getOrderId());              hasAny = true; }
        if (entity.getClaimId()              != null) { update.set(r.claimId,              entity.getClaimId());              hasAny = true; }
        if (entity.getRefundTypeCd()         != null) { update.set(r.refundTypeCd,         entity.getRefundTypeCd());         hasAny = true; }
        if (entity.getRefundProdAmt()        != null) { update.set(r.refundProdAmt,        entity.getRefundProdAmt());        hasAny = true; }
        if (entity.getRefundCouponAmt()      != null) { update.set(r.refundCouponAmt,      entity.getRefundCouponAmt());      hasAny = true; }
        if (entity.getRefundShipAmt()        != null) { update.set(r.refundShipAmt,        entity.getRefundShipAmt());        hasAny = true; }
        if (entity.getRefundSaveAmt()        != null) { update.set(r.refundSaveAmt,        entity.getRefundSaveAmt());        hasAny = true; }
        if (entity.getRefundCacheAmt()       != null) { update.set(r.refundCacheAmt,       entity.getRefundCacheAmt());       hasAny = true; }
        if (entity.getTotalRefundAmt()       != null) { update.set(r.totalRefundAmt,       entity.getTotalRefundAmt());       hasAny = true; }
        if (entity.getRefundStatusCd()       != null) { update.set(r.refundStatusCd,       entity.getRefundStatusCd());       hasAny = true; }
        if (entity.getRefundStatusCdBefore() != null) { update.set(r.refundStatusCdBefore, entity.getRefundStatusCdBefore()); hasAny = true; }
        if (entity.getRefundReqDate()        != null) { update.set(r.refundReqDate,        entity.getRefundReqDate());        hasAny = true; }
        if (entity.getRefundCompltDate()     != null) { update.set(r.refundCompltDate,     entity.getRefundCompltDate());     hasAny = true; }
        if (entity.getFaultTypeCd()          != null) { update.set(r.faultTypeCd,          entity.getFaultTypeCd());          hasAny = true; }
        if (entity.getRefundReason()         != null) { update.set(r.refundReason,         entity.getRefundReason());         hasAny = true; }
        if (entity.getMemo()                 != null) { update.set(r.memo,                 entity.getMemo());                 hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(r.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(r.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(r.refundId.eq(entity.getRefundId())).execute();
        return (int) affected;
    }
}
