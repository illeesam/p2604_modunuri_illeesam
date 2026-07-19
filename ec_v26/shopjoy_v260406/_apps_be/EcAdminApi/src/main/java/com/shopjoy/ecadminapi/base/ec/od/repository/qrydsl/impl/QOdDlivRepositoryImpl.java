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
    private static final QOdDliv   odDliv    = QOdDliv.odDliv;
    private static final QOdOrder  odOrder    = QOdOrder.odOrder;
    private static final QSyVendor syVendor    = QSyVendor.syVendor;
    private static final QSyCode   cdDs = new QSyCode("cd_ds");
    private static final QSyCode   cdDt = new QSyCode("cd_dt");
    private static final QSyCode   cdDd = new QSyCode("cd_dd");
    private static final QSyCode   cdOc = new QSyCode("cd_oc");
    private static final QSyCode   cdIc = new QSyCode("cd_ic");

    /* 배송 baseSelColumnQuery */
    private JPAQuery<OdDlivDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdDlivDto.Item.class,
                        odDliv.dlivId, odDliv.siteId, odDliv.orderId, odDliv.vendorId,
                        odDliv.dlivTypeCd, odDliv.dlivDivCd, odDliv.dlivStatusCd, odDliv.dlivStatusCdBefore,
                        odDliv.outboundCourierCd, odDliv.outboundTrackingNo,
                        odDliv.dlivShipDate, odDliv.dlivDate,
                        odDliv.shippingFee,
                        odDliv.inboundCourierCd, odDliv.inboundTrackingNo,
                        odDliv.recvNm, odDliv.recvPhone, odDliv.recvZip, odDliv.recvAddr, odDliv.recvAddrDetail,
                        odDliv.dlivMemo,
                        odDliv.regBy, odDliv.regDate, odDliv.updBy, odDliv.updDate,
                        odOrder.memberNm.as("memberNm"),
                        odOrder.orderDate.as("orderDate"),
                        odOrder.orderStatusCd.as("orderStatusCd"),
                        syVendor.vendorNm.as("vendorNm"),
                        syVendor.vendorPhone.as("vendorTel"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdDt.codeLabel.as("dlivTypeCdNm"),
                        cdDd.codeLabel.as("dlivDivCdNm"),
                        cdOc.codeLabel.as("outboundCourierCdNm"),
                        cdIc.codeLabel.as("inboundCourierCdNm")
                ))
                .from(odDliv)
                .leftJoin(odOrder).on(odOrder.orderId.eq(odDliv.orderId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(odDliv.vendorId))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(odDliv.dlivStatusCd)))
                .leftJoin(cdDt).on(cdDt.codeGrp.eq("DLIV_TYPE").and(cdDt.codeValue.eq(odDliv.dlivTypeCd)))
                .leftJoin(cdDd).on(cdDd.codeGrp.eq("DLIV_DIV").and(cdDd.codeValue.eq(odDliv.dlivDivCd)))
                .leftJoin(cdOc).on(cdOc.codeGrp.eq("COURIER").and(cdOc.codeValue.eq(odDliv.outboundCourierCd)))
                .leftJoin(cdIc).on(cdIc.codeGrp.eq("COURIER").and(cdIc.codeValue.eq(odDliv.inboundCourierCd)));
    }

    /* 배송 키조회 */
    @Override
    public Optional<OdDlivDto.Item> selectById(String dlivId) {
        OdDlivDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odDliv.dlivId.eq(dlivId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 목록조회 */
    @Override
    public List<OdDlivDto.Item> selectList(OdDlivDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andOrderIdsIn(search),
                    andOrderIdEq(search),
                    andSiteIdEq(search),
                    andDlivIdEq(search),
                    andMemberIdEq(search),
                    andDlivStatusCdEq(search),
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

    /* 배송 페이지조회 */
    @Override
    public OdDlivDto.PageResponse selectPageData(OdDlivDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andOrderIdsIn(search),
                andOrderIdEq(search),
                andSiteIdEq(search),
                andDlivIdEq(search),
                andMemberIdEq(search),
                andDlivStatusCdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdDlivDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdDlivDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odDliv.count())
                .where(wheres)
                .fetchOne();

        OdDlivDto.PageResponse res = new OdDlivDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* orderId IN */
    private BooleanExpression andOrderIdsIn(OdDlivDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getOrderIds())
                ? odDliv.orderId.in(search.getOrderIds()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression andOrderIdEq(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? odDliv.orderId.eq(search.getOrderId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odDliv.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivId 정확 일치 */
    private BooleanExpression andDlivIdEq(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivId())
                ? odDliv.dlivId.eq(search.getDlivId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression andMemberIdEq(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? odDliv.memberId.eq(search.getMemberId()) : null;
    }

    /* dlivStatusCd 정확 일치 */
    private BooleanExpression andDlivStatusCdEq(OdDlivDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivStatusCd())
                ? odDliv.dlivStatusCd.eq(search.getDlivStatusCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(OdDlivDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "dliv_ship_date": return odDliv.dlivShipDate.goe(start).and(odDliv.dlivShipDate.lt(endExcl));
            case "dliv_date": return odDliv.dlivDate.goe(start).and(odDliv.dlivDate.lt(endExcl));
            case "reg_date": return odDliv.regDate.goe(start).and(odDliv.regDate.lt(endExcl));
            case "upd_date": return odDliv.updDate.goe(start).and(odDliv.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(OdDlivDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",apprAprvUserId,", odDliv.apprAprvUserId, pattern);
        or = orLike(or, all, types, ",apprReason,", odDliv.apprReason, pattern);
        or = orLike(or, all, types, ",apprReqUserId,", odDliv.apprReqUserId, pattern);
        or = orLike(or, all, types, ",apprStatusCd,", odDliv.apprStatusCd, pattern);
        or = orLike(or, all, types, ",apprStatusCdBefore,", odDliv.apprStatusCdBefore, pattern);
        or = orLike(or, all, types, ",apprTargetCd,", odDliv.apprTargetCd, pattern);
        or = orLike(or, all, types, ",apprTargetNm,", odDliv.apprTargetNm, pattern);
        or = orLike(or, all, types, ",claimId,", odDliv.claimId, pattern);
        or = orLike(or, all, types, ",dlivDivCd,", odDliv.dlivDivCd, pattern);
        or = orLike(or, all, types, ",dlivId,", odDliv.dlivId, pattern);
        or = orLike(or, all, types, ",dlivMemo,", odDliv.dlivMemo, pattern);
        or = orLike(or, all, types, ",dlivPayTypeCd,", odDliv.dlivPayTypeCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCd,", odDliv.dlivStatusCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCdBefore,", odDliv.dlivStatusCdBefore, pattern);
        or = orLike(or, all, types, ",dlivTypeCd,", odDliv.dlivTypeCd, pattern);
        or = orLike(or, all, types, ",inboundCourierCd,", odDliv.inboundCourierCd, pattern);
        or = orLike(or, all, types, ",inboundTrackingNo,", odDliv.inboundTrackingNo, pattern);
        or = orLike(or, all, types, ",memberId,", odDliv.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", odDliv.memberNm, pattern);
        or = orLike(or, all, types, ",orderId,", odDliv.orderId, pattern);
        or = orLike(or, all, types, ",outboundCourierCd,", odDliv.outboundCourierCd, pattern);
        or = orLike(or, all, types, ",outboundTrackingNo,", odDliv.outboundTrackingNo, pattern);
        or = orLike(or, all, types, ",parentDlivId,", odDliv.parentDlivId, pattern);
        or = orLike(or, all, types, ",recvAddr,", odDliv.recvAddr, pattern);
        or = orLike(or, all, types, ",recvAddrDetail,", odDliv.recvAddrDetail, pattern);
        or = orLike(or, all, types, ",recvNm,", odDliv.recvNm, pattern);
        or = orLike(or, all, types, ",recvPhone,", odDliv.recvPhone, pattern);
        or = orLike(or, all, types, ",recvZip,", odDliv.recvZip, pattern);
        or = orLike(or, all, types, ",shippingFeeTypeCd,", odDliv.shippingFeeTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", odDliv.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", odDliv.vendorId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, odDliv.regDate));
            orders.add(new OrderSpecifier(Order.ASC,  odDliv.dlivId));
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
                    orders.add(new OrderSpecifier(order, odDliv.dlivId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, odDliv.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odDliv.regDate));
                }
            }
        }
        /* unknown sort fallback: regDate DESC + PK ASC */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odDliv.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC,  odDliv.dlivId));
        }
        return orders;
    }

    /* 배송 수정 */


    @Override
    public int updateSelective(OdDliv entity) {
        if (entity.getDlivId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odDliv);
        boolean hasAny = false;

        if (entity.getDlivStatusCd()       != null) { update.set(odDliv.dlivStatusCd,       entity.getDlivStatusCd());       hasAny = true; }
        if (entity.getDlivStatusCdBefore() != null) { update.set(odDliv.dlivStatusCdBefore, entity.getDlivStatusCdBefore()); hasAny = true; }
        if (entity.getOutboundCourierCd()  != null) { update.set(odDliv.outboundCourierCd,  entity.getOutboundCourierCd());  hasAny = true; }
        if (entity.getOutboundTrackingNo() != null) { update.set(odDliv.outboundTrackingNo, entity.getOutboundTrackingNo()); hasAny = true; }
        if (entity.getDlivShipDate()       != null) { update.set(odDliv.dlivShipDate,       entity.getDlivShipDate());       hasAny = true; }
        if (entity.getDlivDate()           != null) { update.set(odDliv.dlivDate,           entity.getDlivDate());           hasAny = true; }
        if (entity.getDlivMemo()           != null) { update.set(odDliv.dlivMemo,           entity.getDlivMemo());           hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(odDliv.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odDliv.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odDliv.dlivId.eq(entity.getDlivId())).execute();
        return (int) affected;
    }
}
