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
    private static final QOdOrder  a   = QOdOrder.odOrder;
    private static final QMbMember m   = QMbMember.mbMember;
    private static final QSySite   s   = QSySite.sySite;
    private static final QPmCoupon cou = QPmCoupon.pmCoupon;
    private static final QSyCode   cdOs = new QSyCode("cd_os");
    private static final QSyCode   cdPm = new QSyCode("cd_pm");
    private static final QSyCode   cdDs = new QSyCode("cd_ds");
    private static final QSyCode   cdRb = new QSyCode("cd_rb");
    private static final QSyCode   cdAp = new QSyCode("cd_ap");
    private static final QSyCode   cdAt = new QSyCode("cd_at");
    private static final QSyCode   cdAc = new QSyCode("cd_ac");

    /* 주문 키조회 */
    @Override
    public Optional<OdOrderDto.Item> selectById(String orderId) {
        OdOrderDto.Item dto = queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        // a.* equivalent (DTO Item 에 존재하는 필드만)
                        a.orderId, a.siteId, a.memberId, a.memberNm, a.ordererEmail,
                        a.totalAmt, a.payAmt,
                        a.orderStatusCd, a.orderStatusCdBefore,
                        a.payMethodCd, a.dlivStatusCd, a.couponId,
                        a.recvNm, a.recvPhone, a.recvZip, a.recvAddr, a.recvAddrDetail, a.recvMemo,
                        a.refundBankCd, a.refundAccountNo, a.refundAccountNm,
                        a.accessChannelCd,
                        a.apprStatusCd, a.apprStatusCdBefore, a.apprAmt,
                        a.apprTargetCd, a.apprTargetNm, a.apprReason,
                        a.apprReqUserId, a.apprReqDate, a.apprAprvUserId, a.apprAprvDate,
                        a.memo, a.orderDate,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        // joined
                        m.loginId.as("memberEmail"),
                        m.memberPhone.as("memberPhoneOrigin"),
                        m.gradeCd.as("gradeCd"),
                        m.totalPurchaseAmt.as("totalPurchaseAmt"),
                        s.siteNm.as("siteNm"),
                        cou.couponNm.as("couponNm"),
                        cou.couponTypeCd.as("couponTypeCd"),
                        cdOs.codeLabel.as("orderStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdRb.codeLabel.as("refundBankCdNm"),
                        cdAp.codeLabel.as("apprStatusCdNm"),
                        cdAt.codeLabel.as("apprTargetCdNm")
                ))
                .from(a)
                .leftJoin(m).on(m.memberId.eq(a.memberId))
                .leftJoin(s).on(s.siteId.eq(a.siteId))
                .leftJoin(cou).on(cou.couponId.eq(a.couponId))
                .leftJoin(cdOs).on(cdOs.codeGrp.eq("ORDER_STATUS").and(cdOs.codeValue.eq(a.orderStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(a.payMethodCd)))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(a.dlivStatusCd)))
                .leftJoin(cdRb).on(cdRb.codeGrp.eq("BANK_CODE").and(cdRb.codeValue.eq(a.refundBankCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(a.apprStatusCd)))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("APPROVAL_TARGET").and(cdAt.codeValue.eq(a.apprTargetCd)))
                .where(a.orderId.eq(orderId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 목록조회 */
    @Override
    public List<OdOrderDto.Item> selectList(OdOrderDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndOrderId(search),
                baseAndMemberId(search),
                baseAndOrderStatusCd(search),
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

    /* 주문 페이지조회 */
    @Override
    public OdOrderDto.PageResponse selectPageList(OdOrderDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndOrderId(search),
                baseAndMemberId(search),
                baseAndOrderStatusCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdOrderDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .leftJoin(m).on(m.memberId.eq(a.memberId))
                .where(
                baseAndSiteId(search),
                baseAndOrderId(search),
                baseAndMemberId(search),
                baseAndOrderStatusCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        OdOrderDto.PageResponse res = new OdOrderDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdOrderDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        a.orderId, a.siteId, a.memberId, a.memberNm, a.ordererEmail,
                        a.totalAmt, a.payAmt,
                        a.orderStatusCd, a.orderStatusCdBefore,
                        a.payMethodCd, a.dlivStatusCd, a.couponId,
                        a.recvNm, a.recvPhone, a.recvZip, a.recvAddr, a.recvAddrDetail, a.recvMemo,
                        a.refundBankCd, a.refundAccountNo, a.refundAccountNm,
                        a.accessChannelCd,
                        a.apprStatusCd, a.apprStatusCdBefore, a.apprAmt,
                        a.apprTargetCd, a.apprTargetNm, a.apprReason,
                        a.apprReqUserId, a.apprReqDate, a.apprAprvUserId, a.apprAprvDate,
                        a.memo, a.orderDate,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        m.loginId.as("memberEmail"),
                        s.siteNm.as("siteNm"),
                        cou.couponNm.as("couponNm"),
                        cdOs.codeLabel.as("orderStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdAc.codeLabel.as("accessChannelCdNm"),
                        cdAp.codeLabel.as("apprStatusCdNm")
                ))
                .from(a)
                .leftJoin(m).on(m.memberId.eq(a.memberId))
                .leftJoin(s).on(s.siteId.eq(a.siteId))
                .leftJoin(cou).on(cou.couponId.eq(a.couponId))
                .leftJoin(cdOs).on(cdOs.codeGrp.eq("ORDER_STATUS").and(cdOs.codeValue.eq(a.orderStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(a.payMethodCd)))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(a.dlivStatusCd)))
                .leftJoin(cdAc).on(cdAc.codeGrp.eq("ACCESS_CHANNEL").and(cdAc.codeValue.eq(a.accessChannelCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(a.apprStatusCd)));
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
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression baseAndOrderId(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? a.orderId.eq(search.getOrderId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? a.memberId.eq(search.getMemberId()) : null;
    }

    /* orderStatusCd 정확 일치 */
    private BooleanExpression baseAndOrderStatusCd(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderStatusCd())
                ? a.orderStatusCd.eq(search.getOrderStatusCd()) : null;
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
            case "order_date": return a.orderDate.goe(start).and(a.orderDate.lt(endExcl));
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            case "pay_date": return a.payDate.goe(start).and(a.payDate.lt(endExcl));
            case "dliv_ship_date": return a.dlivShipDate.goe(start).and(a.dlivShipDate.lt(endExcl));
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
        or = orLike(or, all, types, ",accessChannelCd,", a.accessChannelCd, pattern);
        or = orLike(or, all, types, ",apprAprvUserId,", a.apprAprvUserId, pattern);
        or = orLike(or, all, types, ",apprReason,", a.apprReason, pattern);
        or = orLike(or, all, types, ",apprReqUserId,", a.apprReqUserId, pattern);
        or = orLike(or, all, types, ",apprStatusCd,", a.apprStatusCd, pattern);
        or = orLike(or, all, types, ",apprStatusCdBefore,", a.apprStatusCdBefore, pattern);
        or = orLike(or, all, types, ",apprTargetCd,", a.apprTargetCd, pattern);
        or = orLike(or, all, types, ",apprTargetNm,", a.apprTargetNm, pattern);
        or = orLike(or, all, types, ",couponId,", a.couponId, pattern);
        or = orLike(or, all, types, ",dlivCourierCd,", a.dlivCourierCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCd,", a.dlivStatusCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCdBefore,", a.dlivStatusCdBefore, pattern);
        or = orLike(or, all, types, ",dlivTrackingNo,", a.dlivTrackingNo, pattern);
        or = orLike(or, all, types, ",entrancePwd,", a.entrancePwd, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", a.memberNm, pattern);
        or = orLike(or, all, types, ",memo,", a.memo, pattern);
        or = orLike(or, all, types, ",orderGradeCd,", a.orderGradeCd, pattern);
        or = orLike(or, all, types, ",orderId,", a.orderId, pattern);
        or = orLike(or, all, types, ",orderStatusCd,", a.orderStatusCd, pattern);
        or = orLike(or, all, types, ",orderStatusCdBefore,", a.orderStatusCdBefore, pattern);
        or = orLike(or, all, types, ",ordererEmail,", a.ordererEmail, pattern);
        or = orLike(or, all, types, ",payMethodCd,", a.payMethodCd, pattern);
        or = orLike(or, all, types, ",recvAddr,", a.recvAddr, pattern);
        or = orLike(or, all, types, ",recvAddrDetail,", a.recvAddrDetail, pattern);
        or = orLike(or, all, types, ",recvMemo,", a.recvMemo, pattern);
        or = orLike(or, all, types, ",recvNm,", a.recvNm, pattern);
        or = orLike(or, all, types, ",recvPhone,", a.recvPhone, pattern);
        or = orLike(or, all, types, ",recvZip,", a.recvZip, pattern);
        or = orLike(or, all, types, ",refundAccountNm,", a.refundAccountNm, pattern);
        or = orLike(or, all, types, ",refundAccountNo,", a.refundAccountNo, pattern);
        or = orLike(or, all, types, ",refundBankCd,", a.refundBankCd, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdOrderDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.orderDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.orderId));
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
                    orders.add(new OrderSpecifier(order, a.orderId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.memberNm));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.orderDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.orderId));
        }
        return orders;
    }

    /* 주문 수정 */
    @Override
    public int updateSelective(OdOrder entity) {
        if (entity.getOrderId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getOrderStatusCd()       != null) { update.set(a.orderStatusCd,       entity.getOrderStatusCd());       hasAny = true; }
        if (entity.getOrderStatusCdBefore() != null) { update.set(a.orderStatusCdBefore, entity.getOrderStatusCdBefore()); hasAny = true; }
        if (entity.getPayAmt()              != null) { update.set(a.payAmt,              entity.getPayAmt());              hasAny = true; }
        if (entity.getDlivStatusCd()        != null) { update.set(a.dlivStatusCd,        entity.getDlivStatusCd());        hasAny = true; }
        if (entity.getMemo()                != null) { update.set(a.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getApprStatusCd()        != null) { update.set(a.apprStatusCd,        entity.getApprStatusCd());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(a.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.orderId.eq(entity.getOrderId())).execute();
        return (int) affected;
    }
}
