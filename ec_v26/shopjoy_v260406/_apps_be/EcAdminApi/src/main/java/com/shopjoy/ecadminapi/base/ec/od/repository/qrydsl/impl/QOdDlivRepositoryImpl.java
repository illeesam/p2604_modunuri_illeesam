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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdDliv;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdDliv QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdDlivRepositoryImpl implements QOdDlivRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdDlivRepositoryImpl";
    private static final QOdDliv   a    = QOdDliv.odDliv;
    private static final QOdOrder  o    = QOdOrder.odOrder;
    private static final QSyVendor v    = QSyVendor.syVendor;
    private static final QSyCode   cdDs = new QSyCode("cd_ds");
    private static final QSyCode   cdDt = new QSyCode("cd_dt");
    private static final QSyCode   cdDd = new QSyCode("cd_dd");
    private static final QSyCode   cdOc = new QSyCode("cd_oc");
    private static final QSyCode   cdIc = new QSyCode("cd_ic");

    /* 배송 baseSelColumnQuery */
    private JPAQuery<OdDlivDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdDlivDto.Item.class,
                        a.dlivId, a.siteId, a.orderId, a.vendorId,
                        a.dlivTypeCd, a.dlivDivCd, a.dlivStatusCd, a.dlivStatusCdBefore,
                        a.outboundCourierCd, a.outboundTrackingNo,
                        a.dlivShipDate, a.dlivDate,
                        a.shippingFee,
                        a.inboundCourierCd, a.inboundTrackingNo,
                        a.recvNm, a.recvPhone, a.recvZip, a.recvAddr, a.recvAddrDetail,
                        a.dlivMemo,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        o.memberNm.as("memberNm"),
                        o.orderDate.as("orderDate"),
                        o.orderStatusCd.as("orderStatusCd"),
                        v.vendorNm.as("vendorNm"),
                        v.vendorPhone.as("vendorTel"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdDt.codeLabel.as("dlivTypeCdNm"),
                        cdDd.codeLabel.as("dlivDivCdNm"),
                        cdOc.codeLabel.as("outboundCourierCdNm"),
                        cdIc.codeLabel.as("inboundCourierCdNm")
                ))
                .from(a)
                .leftJoin(o).on(o.orderId.eq(a.orderId))
                .leftJoin(v).on(v.vendorId.eq(a.vendorId))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(a.dlivStatusCd)))
                .leftJoin(cdDt).on(cdDt.codeGrp.eq("DLIV_TYPE").and(cdDt.codeValue.eq(a.dlivTypeCd)))
                .leftJoin(cdDd).on(cdDd.codeGrp.eq("DLIV_DIV").and(cdDd.codeValue.eq(a.dlivDivCd)))
                .leftJoin(cdOc).on(cdOc.codeGrp.eq("COURIER").and(cdOc.codeValue.eq(a.outboundCourierCd)))
                .leftJoin(cdIc).on(cdIc.codeGrp.eq("COURIER").and(cdIc.codeValue.eq(a.inboundCourierCd)));
    }

    /* 배송 키조회 */
    @Override
    public Optional<OdDlivDto.Item> selectById(String dlivId) {
        OdDlivDto.Item dto = baseSelColumnQuery()
                .where(a.dlivId.eq(dlivId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 목록조회 */
    @Override
    public List<OdDlivDto.Item> selectList(OdDlivDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivDto.Item> query = baseSelColumnQuery().where(
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndDlivId(search),
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

    /* 배송 페이지조회 */
    @Override
    public OdDlivDto.PageResponse selectPageList(OdDlivDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivDto.Item> query = baseSelColumnQuery().where(
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndDlivId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdDlivDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .leftJoin(o).on(o.orderId.eq(a.orderId))
                .where(
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndDlivId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        OdDlivDto.PageResponse res = new OdDlivDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* orderId IN */
    private BooleanExpression baseAndOrderIds(OdDlivDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getOrderIds())
                ? a.orderId.in(search.getOrderIds()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression baseAndOrderId(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? a.orderId.eq(search.getOrderId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivId 정확 일치 */
    private BooleanExpression baseAndDlivId(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivId())
                ? a.dlivId.eq(search.getDlivId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdDlivDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "dliv_ship_date": return a.dlivShipDate.goe(start).and(a.dlivShipDate.lt(endExcl));
            case "dliv_date": return a.dlivDate.goe(start).and(a.dlivDate.lt(endExcl));
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdDlivDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",apprAprvUserId,", a.apprAprvUserId, pattern);
        or = orLike(or, all, types, ",apprReason,", a.apprReason, pattern);
        or = orLike(or, all, types, ",apprReqUserId,", a.apprReqUserId, pattern);
        or = orLike(or, all, types, ",apprStatusCd,", a.apprStatusCd, pattern);
        or = orLike(or, all, types, ",apprStatusCdBefore,", a.apprStatusCdBefore, pattern);
        or = orLike(or, all, types, ",apprTargetCd,", a.apprTargetCd, pattern);
        or = orLike(or, all, types, ",apprTargetNm,", a.apprTargetNm, pattern);
        or = orLike(or, all, types, ",claimId,", a.claimId, pattern);
        or = orLike(or, all, types, ",dlivDivCd,", a.dlivDivCd, pattern);
        or = orLike(or, all, types, ",dlivId,", a.dlivId, pattern);
        or = orLike(or, all, types, ",dlivMemo,", a.dlivMemo, pattern);
        or = orLike(or, all, types, ",dlivPayTypeCd,", a.dlivPayTypeCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCd,", a.dlivStatusCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCdBefore,", a.dlivStatusCdBefore, pattern);
        or = orLike(or, all, types, ",dlivTypeCd,", a.dlivTypeCd, pattern);
        or = orLike(or, all, types, ",inboundCourierCd,", a.inboundCourierCd, pattern);
        or = orLike(or, all, types, ",inboundTrackingNo,", a.inboundTrackingNo, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", a.memberNm, pattern);
        or = orLike(or, all, types, ",orderId,", a.orderId, pattern);
        or = orLike(or, all, types, ",outboundCourierCd,", a.outboundCourierCd, pattern);
        or = orLike(or, all, types, ",outboundTrackingNo,", a.outboundTrackingNo, pattern);
        or = orLike(or, all, types, ",parentDlivId,", a.parentDlivId, pattern);
        or = orLike(or, all, types, ",recvAddr,", a.recvAddr, pattern);
        or = orLike(or, all, types, ",recvAddrDetail,", a.recvAddrDetail, pattern);
        or = orLike(or, all, types, ",recvNm,", a.recvNm, pattern);
        or = orLike(or, all, types, ",recvPhone,", a.recvPhone, pattern);
        or = orLike(or, all, types, ",recvZip,", a.recvZip, pattern);
        or = orLike(or, all, types, ",shippingFeeTypeCd,", a.shippingFeeTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", a.vendorId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdDlivDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            /* 기본 정렬: regDate DESC + PK ASC (안정 정렬 — 저장 시마다 동률 행 순서 흔들림 방지) */
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier(Order.ASC,  a.dlivId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.dlivId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* unknown sort fallback: regDate DESC + PK ASC */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC,  a.dlivId));
        }
        return orders;
    }

    /* 배송 수정 */


    @Override
    public int updateSelective(OdDliv entity) {
        if (entity.getDlivId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getDlivStatusCd()       != null) { update.set(a.dlivStatusCd,       entity.getDlivStatusCd());       hasAny = true; }
        if (entity.getDlivStatusCdBefore() != null) { update.set(a.dlivStatusCdBefore, entity.getDlivStatusCdBefore()); hasAny = true; }
        if (entity.getOutboundCourierCd()  != null) { update.set(a.outboundCourierCd,  entity.getOutboundCourierCd());  hasAny = true; }
        if (entity.getOutboundTrackingNo() != null) { update.set(a.outboundTrackingNo, entity.getOutboundTrackingNo()); hasAny = true; }
        if (entity.getDlivShipDate()       != null) { update.set(a.dlivShipDate,       entity.getDlivShipDate());       hasAny = true; }
        if (entity.getDlivDate()           != null) { update.set(a.dlivDate,           entity.getDlivDate());           hasAny = true; }
        if (entity.getDlivMemo()           != null) { update.set(a.dlivMemo,           entity.getDlivMemo());           hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(a.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.dlivId.eq(entity.getDlivId())).execute();
        return (int) affected;
    }
}
