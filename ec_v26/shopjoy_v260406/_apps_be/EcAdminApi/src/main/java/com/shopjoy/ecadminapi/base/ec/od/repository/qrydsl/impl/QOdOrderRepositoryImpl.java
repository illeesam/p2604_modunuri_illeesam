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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderRepository;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
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

/** OdOrder QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderRepositoryImpl implements QOdOrderRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdOrderRepositoryImpl";
    private static final QOdOrder  odOrder   = QOdOrder.odOrder;
    private static final QMbMember mbMember   = QMbMember.mbMember;
    private static final QSySite   sySite   = QSySite.sySite;
    private static final QPmCoupon pmCoupon = QPmCoupon.pmCoupon;
    private static final QSyCode   cdOs = new QSyCode("cd_os");
    private static final QSyCode   cdPm = new QSyCode("cd_pm");
    private static final QSyCode   cdDs = new QSyCode("cd_ds");
    private static final QSyCode   cdRb = new QSyCode("cd_rb");
    private static final QSyCode   cdAp = new QSyCode("cd_ap");
    private static final QSyCode   cdAt = new QSyCode("cd_at");
    private static final QSyCode   cdAc = new QSyCode("cd_ac");

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdOrderDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        odOrder.orderId, odOrder.siteId, odOrder.memberId, odOrder.memberNm, odOrder.ordererEmail,
                        odOrder.totalAmt, odOrder.payAmt,
                        odOrder.orderStatusCd, odOrder.orderStatusCdBefore,
                        odOrder.payMethodCd, odOrder.dlivStatusCd, odOrder.couponId,
                        odOrder.recvNm, odOrder.recvPhone, odOrder.recvZip, odOrder.recvAddr, odOrder.recvAddrDetail, odOrder.recvMemo,
                        odOrder.refundBankCd, odOrder.refundAccountNo, odOrder.refundAccountNm,
                        odOrder.accessChannelCd,
                        odOrder.apprStatusCd, odOrder.apprStatusCdBefore, odOrder.apprAmt,
                        odOrder.apprTargetCd, odOrder.apprTargetNm, odOrder.apprReason,
                        odOrder.apprReqUserId, odOrder.apprReqDate, odOrder.apprAprvUserId, odOrder.apprAprvDate,
                        odOrder.memo, odOrder.orderDate,
                        odOrder.regBy, odOrder.regDate, odOrder.updBy, odOrder.updDate,
                        mbMember.loginId.as("memberEmail"),
                        sySite.siteNm.as("siteNm"),
                        pmCoupon.couponNm.as("couponNm"),
                        cdOs.codeLabel.as("orderStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdAc.codeLabel.as("accessChannelCdNm"),
                        cdAp.codeLabel.as("apprStatusCdNm")
                ))
                .from(odOrder)
                .leftJoin(mbMember).on(mbMember.memberId.eq(odOrder.memberId))
                .leftJoin(sySite).on(sySite.siteId.eq(odOrder.siteId))
                .leftJoin(pmCoupon).on(pmCoupon.couponId.eq(odOrder.couponId))
                .leftJoin(cdOs).on(cdOs.codeGrp.eq("ORDER_STATUS").and(cdOs.codeValue.eq(odOrder.orderStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(odOrder.payMethodCd)))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(odOrder.dlivStatusCd)))
                .leftJoin(cdAc).on(cdAc.codeGrp.eq("ACCESS_CHANNEL").and(cdAc.codeValue.eq(odOrder.accessChannelCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(odOrder.apprStatusCd)));
    }

    /* 주문 키조회 */
    @Override
    public Optional<OdOrderDto.Item> selectById(String orderId) {
        OdOrderDto.Item dto = queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        // a.* equivalent (DTO Item 에 존재하는 필드만)
                        odOrder.orderId, odOrder.siteId, odOrder.memberId, odOrder.memberNm, odOrder.ordererEmail,
                        odOrder.totalAmt, odOrder.payAmt,
                        odOrder.orderStatusCd, odOrder.orderStatusCdBefore,
                        odOrder.payMethodCd, odOrder.dlivStatusCd, odOrder.couponId,
                        odOrder.recvNm, odOrder.recvPhone, odOrder.recvZip, odOrder.recvAddr, odOrder.recvAddrDetail, odOrder.recvMemo,
                        odOrder.refundBankCd, odOrder.refundAccountNo, odOrder.refundAccountNm,
                        odOrder.accessChannelCd,
                        odOrder.apprStatusCd, odOrder.apprStatusCdBefore, odOrder.apprAmt,
                        odOrder.apprTargetCd, odOrder.apprTargetNm, odOrder.apprReason,
                        odOrder.apprReqUserId, odOrder.apprReqDate, odOrder.apprAprvUserId, odOrder.apprAprvDate,
                        odOrder.memo, odOrder.orderDate,
                        odOrder.regBy, odOrder.regDate, odOrder.updBy, odOrder.updDate,
                        // joined
                        mbMember.loginId.as("memberEmail"),
                        mbMember.memberPhone.as("memberPhoneOrigin"),
                        mbMember.gradeCd.as("gradeCd"),
                        mbMember.totalPurchaseAmt.as("totalPurchaseAmt"),
                        sySite.siteNm.as("siteNm"),
                        pmCoupon.couponNm.as("couponNm"),
                        pmCoupon.couponTypeCd.as("couponTypeCd"),
                        cdOs.codeLabel.as("orderStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdRb.codeLabel.as("refundBankCdNm"),
                        cdAp.codeLabel.as("apprStatusCdNm"),
                        cdAt.codeLabel.as("apprTargetCdNm")
                ))
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").from(odOrder)
                .leftJoin(mbMember).on(mbMember.memberId.eq(odOrder.memberId))
                .leftJoin(sySite).on(sySite.siteId.eq(odOrder.siteId))
                .leftJoin(pmCoupon).on(pmCoupon.couponId.eq(odOrder.couponId))
                .leftJoin(cdOs).on(cdOs.codeGrp.eq("ORDER_STATUS").and(cdOs.codeValue.eq(odOrder.orderStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(odOrder.payMethodCd)))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(odOrder.dlivStatusCd)))
                .leftJoin(cdRb).on(cdRb.codeGrp.eq("BANK_CODE").and(cdRb.codeValue.eq(odOrder.refundBankCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(odOrder.apprStatusCd)))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("APPROVAL_TARGET").and(cdAt.codeValue.eq(odOrder.apprTargetCd)))
                .where(odOrder.orderId.eq(orderId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 목록조회 */
    @Override
    public List<OdOrderDto.Item> selectList(OdOrderDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndOrderId(search),
                    baseAndMemberId(search),
                    baseAndOrderStatusCd(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
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

    /* 주문 페이지조회 */
    @Override
    public OdOrderDto.PageResponse selectPageData(OdOrderDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndOrderId(search),
                baseAndMemberId(search),
                baseAndOrderStatusCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdOrderDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdOrderDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odOrder.count())
                .where(wheres)
                .fetchOne();

        OdOrderDto.PageResponse res = new OdOrderDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }



    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odOrder.siteId.eq(search.getSiteId()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression baseAndOrderId(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? odOrder.orderId.eq(search.getOrderId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? odOrder.memberId.eq(search.getMemberId()) : null;
    }

    /* orderStatusCd 정확 일치 */
    private BooleanExpression baseAndOrderStatusCd(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderStatusCd())
                ? odOrder.orderStatusCd.eq(search.getOrderStatusCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdOrderDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "order_date": return odOrder.orderDate.goe(start).and(odOrder.orderDate.lt(endExcl));
            case "reg_date": return odOrder.regDate.goe(start).and(odOrder.regDate.lt(endExcl));
            case "upd_date": return odOrder.updDate.goe(start).and(odOrder.updDate.lt(endExcl));
            case "pay_date": return odOrder.payDate.goe(start).and(odOrder.payDate.lt(endExcl));
            case "dliv_ship_date": return odOrder.dlivShipDate.goe(start).and(odOrder.dlivShipDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdOrderDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",accessChannelCd,", odOrder.accessChannelCd, pattern);
        or = orLike(or, all, types, ",apprAprvUserId,", odOrder.apprAprvUserId, pattern);
        or = orLike(or, all, types, ",apprReason,", odOrder.apprReason, pattern);
        or = orLike(or, all, types, ",apprReqUserId,", odOrder.apprReqUserId, pattern);
        or = orLike(or, all, types, ",apprStatusCd,", odOrder.apprStatusCd, pattern);
        or = orLike(or, all, types, ",apprStatusCdBefore,", odOrder.apprStatusCdBefore, pattern);
        or = orLike(or, all, types, ",apprTargetCd,", odOrder.apprTargetCd, pattern);
        or = orLike(or, all, types, ",apprTargetNm,", odOrder.apprTargetNm, pattern);
        or = orLike(or, all, types, ",couponId,", odOrder.couponId, pattern);
        or = orLike(or, all, types, ",dlivCourierCd,", odOrder.dlivCourierCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCd,", odOrder.dlivStatusCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCdBefore,", odOrder.dlivStatusCdBefore, pattern);
        or = orLike(or, all, types, ",dlivTrackingNo,", odOrder.dlivTrackingNo, pattern);
        or = orLike(or, all, types, ",entrancePwd,", odOrder.entrancePwd, pattern);
        or = orLike(or, all, types, ",memberId,", odOrder.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", odOrder.memberNm, pattern);
        or = orLike(or, all, types, ",memo,", odOrder.memo, pattern);
        or = orLike(or, all, types, ",orderGradeCd,", odOrder.orderGradeCd, pattern);
        or = orLike(or, all, types, ",orderId,", odOrder.orderId, pattern);
        or = orLike(or, all, types, ",orderStatusCd,", odOrder.orderStatusCd, pattern);
        or = orLike(or, all, types, ",orderStatusCdBefore,", odOrder.orderStatusCdBefore, pattern);
        or = orLike(or, all, types, ",ordererEmail,", odOrder.ordererEmail, pattern);
        or = orLike(or, all, types, ",payMethodCd,", odOrder.payMethodCd, pattern);
        or = orLike(or, all, types, ",recvAddr,", odOrder.recvAddr, pattern);
        or = orLike(or, all, types, ",recvAddrDetail,", odOrder.recvAddrDetail, pattern);
        or = orLike(or, all, types, ",recvMemo,", odOrder.recvMemo, pattern);
        or = orLike(or, all, types, ",recvNm,", odOrder.recvNm, pattern);
        or = orLike(or, all, types, ",recvPhone,", odOrder.recvPhone, pattern);
        or = orLike(or, all, types, ",recvZip,", odOrder.recvZip, pattern);
        or = orLike(or, all, types, ",refundAccountNm,", odOrder.refundAccountNm, pattern);
        or = orLike(or, all, types, ",refundAccountNo,", odOrder.refundAccountNo, pattern);
        or = orLike(or, all, types, ",refundBankCd,", odOrder.refundBankCd, pattern);
        or = orLike(or, all, types, ",siteId,", odOrder.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdOrderDto.Request sySite) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = sySite == null ? null : sySite.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odOrder.orderDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrder.orderId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odOrder.orderId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, odOrder.memberNm));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odOrder.orderDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odOrder.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odOrder.orderId));
        }
        return orders;
    }

    /* 주문 수정 */
    @Override
    public int updateSelective(OdOrder entity) {
        if (entity.getOrderId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odOrder);
        boolean hasAny = false;

        if (entity.getOrderStatusCd()       != null) { update.set(odOrder.orderStatusCd,       entity.getOrderStatusCd());       hasAny = true; }
        if (entity.getOrderStatusCdBefore() != null) { update.set(odOrder.orderStatusCdBefore, entity.getOrderStatusCdBefore()); hasAny = true; }
        if (entity.getPayAmt()              != null) { update.set(odOrder.payAmt,              entity.getPayAmt());              hasAny = true; }
        if (entity.getDlivStatusCd()        != null) { update.set(odOrder.dlivStatusCd,        entity.getDlivStatusCd());        hasAny = true; }
        if (entity.getMemo()                != null) { update.set(odOrder.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getApprStatusCd()        != null) { update.set(odOrder.apprStatusCd,        entity.getApprStatusCd());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(odOrder.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odOrder.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odOrder.orderId.eq(entity.getOrderId())).execute();
        return (int) affected;
    }
}
