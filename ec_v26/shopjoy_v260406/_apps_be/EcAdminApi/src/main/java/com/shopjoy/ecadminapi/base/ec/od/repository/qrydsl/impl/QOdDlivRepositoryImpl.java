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
    private static final QOdDliv   d    = QOdDliv.odDliv;
    private static final QOdOrder  o    = QOdOrder.odOrder;
    private static final QSyVendor v    = QSyVendor.syVendor;
    private static final QSyCode   cdDs = new QSyCode("cd_ds");
    private static final QSyCode   cdDt = new QSyCode("cd_dt");
    private static final QSyCode   cdDd = new QSyCode("cd_dd");
    private static final QSyCode   cdOc = new QSyCode("cd_oc");
    private static final QSyCode   cdIc = new QSyCode("cd_ic");

    /* 배송 키조회 */
    @Override
    public Optional<OdDlivDto.Item> selectById(String dlivId) {
        OdDlivDto.Item dto = baseQuery()
                .where(d.dlivId.eq(dlivId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 목록조회 */
    @Override
    public List<OdDlivDto.Item> selectList(OdDlivDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivDto.Item> query = baseQuery().where(
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

        JPAQuery<OdDlivDto.Item> query = baseQuery().where(
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
                .select(d.count())
                .from(d)
                .leftJoin(o).on(o.orderId.eq(d.orderId))
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

    /* 배송 baseQuery */
    private JPAQuery<OdDlivDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdDlivDto.Item.class,
                        d.dlivId, d.siteId, d.orderId, d.vendorId,
                        d.dlivTypeCd, d.dlivDivCd, d.dlivStatusCd, d.dlivStatusCdBefore,
                        d.outboundCourierCd, d.outboundTrackingNo,
                        d.dlivShipDate, d.dlivDate,
                        d.shippingFee,
                        d.inboundCourierCd, d.inboundTrackingNo,
                        d.recvNm, d.recvPhone, d.recvZip, d.recvAddr, d.recvAddrDetail,
                        d.dlivMemo,
                        d.regBy, d.regDate, d.updBy, d.updDate,
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
                .from(d)
                .leftJoin(o).on(o.orderId.eq(d.orderId))
                .leftJoin(v).on(v.vendorId.eq(d.vendorId))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(d.dlivStatusCd)))
                .leftJoin(cdDt).on(cdDt.codeGrp.eq("DLIV_TYPE").and(cdDt.codeValue.eq(d.dlivTypeCd)))
                .leftJoin(cdDd).on(cdDd.codeGrp.eq("DLIV_DIV").and(cdDd.codeValue.eq(d.dlivDivCd)))
                .leftJoin(cdOc).on(cdOc.codeGrp.eq("COURIER").and(cdOc.codeValue.eq(d.outboundCourierCd)))
                .leftJoin(cdIc).on(cdIc.codeGrp.eq("COURIER").and(cdIc.codeValue.eq(d.inboundCourierCd)));
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
                ? d.orderId.in(search.getOrderIds()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression baseAndOrderId(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? d.orderId.eq(search.getOrderId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? d.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivId 정확 일치 */
    private BooleanExpression baseAndDlivId(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivId())
                ? d.dlivId.eq(search.getDlivId()) : null;
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
            case "dliv_ship_date": return d.dlivShipDate.goe(start).and(d.dlivShipDate.lt(endExcl));
            case "dliv_date": return d.dlivDate.goe(start).and(d.dlivDate.lt(endExcl));
            case "reg_date": return d.regDate.goe(start).and(d.regDate.lt(endExcl));
            case "upd_date": return d.updDate.goe(start).and(d.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",apprAprvUserId,", d.apprAprvUserId, pattern);
        or = orLike(or, all, types, ",apprReason,", d.apprReason, pattern);
        or = orLike(or, all, types, ",apprReqUserId,", d.apprReqUserId, pattern);
        or = orLike(or, all, types, ",apprStatusCd,", d.apprStatusCd, pattern);
        or = orLike(or, all, types, ",apprStatusCdBefore,", d.apprStatusCdBefore, pattern);
        or = orLike(or, all, types, ",apprTargetCd,", d.apprTargetCd, pattern);
        or = orLike(or, all, types, ",apprTargetNm,", d.apprTargetNm, pattern);
        or = orLike(or, all, types, ",claimId,", d.claimId, pattern);
        or = orLike(or, all, types, ",dlivDivCd,", d.dlivDivCd, pattern);
        or = orLike(or, all, types, ",dlivId,", d.dlivId, pattern);
        or = orLike(or, all, types, ",dlivMemo,", d.dlivMemo, pattern);
        or = orLike(or, all, types, ",dlivPayTypeCd,", d.dlivPayTypeCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCd,", d.dlivStatusCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCdBefore,", d.dlivStatusCdBefore, pattern);
        or = orLike(or, all, types, ",dlivTypeCd,", d.dlivTypeCd, pattern);
        or = orLike(or, all, types, ",inboundCourierCd,", d.inboundCourierCd, pattern);
        or = orLike(or, all, types, ",inboundTrackingNo,", d.inboundTrackingNo, pattern);
        or = orLike(or, all, types, ",memberId,", d.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", d.memberNm, pattern);
        or = orLike(or, all, types, ",orderId,", d.orderId, pattern);
        or = orLike(or, all, types, ",outboundCourierCd,", d.outboundCourierCd, pattern);
        or = orLike(or, all, types, ",outboundTrackingNo,", d.outboundTrackingNo, pattern);
        or = orLike(or, all, types, ",parentDlivId,", d.parentDlivId, pattern);
        or = orLike(or, all, types, ",recvAddr,", d.recvAddr, pattern);
        or = orLike(or, all, types, ",recvAddrDetail,", d.recvAddrDetail, pattern);
        or = orLike(or, all, types, ",recvNm,", d.recvNm, pattern);
        or = orLike(or, all, types, ",recvPhone,", d.recvPhone, pattern);
        or = orLike(or, all, types, ",recvZip,", d.recvZip, pattern);
        or = orLike(or, all, types, ",shippingFeeTypeCd,", d.shippingFeeTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", d.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", d.vendorId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, d.regDate));
            orders.add(new OrderSpecifier(Order.ASC,  d.dlivId));
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
                    orders.add(new OrderSpecifier(order, d.dlivId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.regDate));
                }
            }
        }
        /* unknown sort fallback: regDate DESC + PK ASC */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, d.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC,  d.dlivId));
        }
        return orders;
    }

    /* 배송 수정 */
    @Override
    public int updateSelective(OdDliv entity) {
        if (entity.getDlivId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(d);
        boolean hasAny = false;

        if (entity.getDlivStatusCd()       != null) { update.set(d.dlivStatusCd,       entity.getDlivStatusCd());       hasAny = true; }
        if (entity.getDlivStatusCdBefore() != null) { update.set(d.dlivStatusCdBefore, entity.getDlivStatusCdBefore()); hasAny = true; }
        if (entity.getOutboundCourierCd()  != null) { update.set(d.outboundCourierCd,  entity.getOutboundCourierCd());  hasAny = true; }
        if (entity.getOutboundTrackingNo() != null) { update.set(d.outboundTrackingNo, entity.getOutboundTrackingNo()); hasAny = true; }
        if (entity.getDlivShipDate()       != null) { update.set(d.dlivShipDate,       entity.getDlivShipDate());       hasAny = true; }
        if (entity.getDlivDate()           != null) { update.set(d.dlivDate,           entity.getDlivDate());           hasAny = true; }
        if (entity.getDlivMemo()           != null) { update.set(d.dlivMemo,           entity.getDlivMemo());           hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(d.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(d.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(d.dlivId.eq(entity.getDlivId())).execute();
        return (int) affected;
    }
}
