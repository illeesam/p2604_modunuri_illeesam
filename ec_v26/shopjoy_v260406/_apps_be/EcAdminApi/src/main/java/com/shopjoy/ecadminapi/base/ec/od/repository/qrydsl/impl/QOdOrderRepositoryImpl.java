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
    private static final QOdOrder  o   = QOdOrder.odOrder;
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
                        // o.* equivalent (DTO Item 에 존재하는 필드만)
                        o.orderId, o.siteId, o.memberId, o.memberNm, o.ordererEmail,
                        o.totalAmt, o.payAmt,
                        o.orderStatusCd, o.orderStatusCdBefore,
                        o.payMethodCd, o.dlivStatusCd, o.couponId,
                        o.recvNm, o.recvPhone, o.recvZip, o.recvAddr, o.recvAddrDetail, o.recvMemo,
                        o.refundBankCd, o.refundAccountNo, o.refundAccountNm,
                        o.accessChannelCd,
                        o.apprStatusCd, o.apprStatusCdBefore, o.apprAmt,
                        o.apprTargetCd, o.apprTargetNm, o.apprReason,
                        o.apprReqUserId, o.apprReqDate, o.apprAprvUserId, o.apprAprvDate,
                        o.memo, o.orderDate,
                        o.regBy, o.regDate, o.updBy, o.updDate,
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
                .from(o)
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .leftJoin(s).on(s.siteId.eq(o.siteId))
                .leftJoin(cou).on(cou.couponId.eq(o.couponId))
                .leftJoin(cdOs).on(cdOs.codeGrp.eq("ORDER_STATUS").and(cdOs.codeValue.eq(o.orderStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(o.payMethodCd)))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(o.dlivStatusCd)))
                .leftJoin(cdRb).on(cdRb.codeGrp.eq("BANK_CODE").and(cdRb.codeValue.eq(o.refundBankCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(o.apprStatusCd)))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("APPROVAL_TARGET").and(cdAt.codeValue.eq(o.apprTargetCd)))
                .where(o.orderId.eq(orderId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 목록조회 */
    @Override
    public List<OdOrderDto.Item> selectList(OdOrderDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andOrderId(search),
                andMemberId(search),
                andOrderStatusCd(search),
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

    /* 주문 페이지조회 */
    @Override
    public OdOrderDto.PageResponse selectPageList(OdOrderDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andOrderId(search),
                andMemberId(search),
                andOrderStatusCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdOrderDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(o.count())
                .from(o)
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .where(
                andSiteId(search),
                andOrderId(search),
                andMemberId(search),
                andOrderStatusCd(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        OdOrderDto.PageResponse res = new OdOrderDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdOrderDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        o.orderId, o.siteId, o.memberId, o.memberNm, o.ordererEmail,
                        o.totalAmt, o.payAmt,
                        o.orderStatusCd, o.orderStatusCdBefore,
                        o.payMethodCd, o.dlivStatusCd, o.couponId,
                        o.recvNm, o.recvPhone, o.recvZip, o.recvAddr, o.recvAddrDetail, o.recvMemo,
                        o.refundBankCd, o.refundAccountNo, o.refundAccountNm,
                        o.accessChannelCd,
                        o.apprStatusCd, o.apprStatusCdBefore, o.apprAmt,
                        o.apprTargetCd, o.apprTargetNm, o.apprReason,
                        o.apprReqUserId, o.apprReqDate, o.apprAprvUserId, o.apprAprvDate,
                        o.memo, o.orderDate,
                        o.regBy, o.regDate, o.updBy, o.updDate,
                        m.loginId.as("memberEmail"),
                        s.siteNm.as("siteNm"),
                        cou.couponNm.as("couponNm"),
                        cdOs.codeLabel.as("orderStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdAc.codeLabel.as("accessChannelCdNm"),
                        cdAp.codeLabel.as("apprStatusCdNm")
                ))
                .from(o)
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .leftJoin(s).on(s.siteId.eq(o.siteId))
                .leftJoin(cou).on(cou.couponId.eq(o.couponId))
                .leftJoin(cdOs).on(cdOs.codeGrp.eq("ORDER_STATUS").and(cdOs.codeValue.eq(o.orderStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(o.payMethodCd)))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(o.dlivStatusCd)))
                .leftJoin(cdAc).on(cdAc.codeGrp.eq("ACCESS_CHANNEL").and(cdAc.codeValue.eq(o.accessChannelCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(o.apprStatusCd)));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? o.siteId.eq(search.getSiteId()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression andOrderId(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? o.orderId.eq(search.getOrderId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression andMemberId(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? o.memberId.eq(search.getMemberId()) : null;
    }

    /* orderStatusCd 정확 일치 */
    private BooleanExpression andOrderStatusCd(OdOrderDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderStatusCd())
                ? o.orderStatusCd.eq(search.getOrderStatusCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(OdOrderDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "order_date": return o.orderDate.goe(start).and(o.orderDate.lt(endExcl));
            case "reg_date": return o.regDate.goe(start).and(o.regDate.lt(endExcl));
            case "upd_date": return o.updDate.goe(start).and(o.updDate.lt(endExcl));
            case "pay_date": return o.payDate.goe(start).and(o.payDate.lt(endExcl));
            case "dliv_ship_date": return o.dlivShipDate.goe(start).and(o.dlivShipDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdOrderDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",accessChannelCd,", o.accessChannelCd, pattern);
        or = orLike(or, all, types, ",apprAprvUserId,", o.apprAprvUserId, pattern);
        or = orLike(or, all, types, ",apprReason,", o.apprReason, pattern);
        or = orLike(or, all, types, ",apprReqUserId,", o.apprReqUserId, pattern);
        or = orLike(or, all, types, ",apprStatusCd,", o.apprStatusCd, pattern);
        or = orLike(or, all, types, ",apprStatusCdBefore,", o.apprStatusCdBefore, pattern);
        or = orLike(or, all, types, ",apprTargetCd,", o.apprTargetCd, pattern);
        or = orLike(or, all, types, ",apprTargetNm,", o.apprTargetNm, pattern);
        or = orLike(or, all, types, ",couponId,", o.couponId, pattern);
        or = orLike(or, all, types, ",dlivCourierCd,", o.dlivCourierCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCd,", o.dlivStatusCd, pattern);
        or = orLike(or, all, types, ",dlivStatusCdBefore,", o.dlivStatusCdBefore, pattern);
        or = orLike(or, all, types, ",dlivTrackingNo,", o.dlivTrackingNo, pattern);
        or = orLike(or, all, types, ",entrancePwd,", o.entrancePwd, pattern);
        or = orLike(or, all, types, ",memberId,", o.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", o.memberNm, pattern);
        or = orLike(or, all, types, ",memo,", o.memo, pattern);
        or = orLike(or, all, types, ",orderGradeCd,", o.orderGradeCd, pattern);
        or = orLike(or, all, types, ",orderId,", o.orderId, pattern);
        or = orLike(or, all, types, ",orderStatusCd,", o.orderStatusCd, pattern);
        or = orLike(or, all, types, ",orderStatusCdBefore,", o.orderStatusCdBefore, pattern);
        or = orLike(or, all, types, ",ordererEmail,", o.ordererEmail, pattern);
        or = orLike(or, all, types, ",payMethodCd,", o.payMethodCd, pattern);
        or = orLike(or, all, types, ",recvAddr,", o.recvAddr, pattern);
        or = orLike(or, all, types, ",recvAddrDetail,", o.recvAddrDetail, pattern);
        or = orLike(or, all, types, ",recvMemo,", o.recvMemo, pattern);
        or = orLike(or, all, types, ",recvNm,", o.recvNm, pattern);
        or = orLike(or, all, types, ",recvPhone,", o.recvPhone, pattern);
        or = orLike(or, all, types, ",recvZip,", o.recvZip, pattern);
        or = orLike(or, all, types, ",refundAccountNm,", o.refundAccountNm, pattern);
        or = orLike(or, all, types, ",refundAccountNo,", o.refundAccountNo, pattern);
        or = orLike(or, all, types, ",refundBankCd,", o.refundBankCd, pattern);
        or = orLike(or, all, types, ",siteId,", o.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, o.orderDate));
            orders.add(new OrderSpecifier<>(Order.ASC, o.orderId));
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
                    orders.add(new OrderSpecifier(order, o.orderId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, o.memberNm));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, o.orderDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, o.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, o.orderId));
        }
        return orders;
    }

    /* 주문 수정 */
    @Override
    public int updateSelective(OdOrder entity) {
        if (entity.getOrderId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(o);
        boolean hasAny = false;

        if (entity.getOrderStatusCd()       != null) { update.set(o.orderStatusCd,       entity.getOrderStatusCd());       hasAny = true; }
        if (entity.getOrderStatusCdBefore() != null) { update.set(o.orderStatusCdBefore, entity.getOrderStatusCdBefore()); hasAny = true; }
        if (entity.getPayAmt()              != null) { update.set(o.payAmt,              entity.getPayAmt());              hasAny = true; }
        if (entity.getDlivStatusCd()        != null) { update.set(o.dlivStatusCd,        entity.getDlivStatusCd());        hasAny = true; }
        if (entity.getMemo()                != null) { update.set(o.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getApprStatusCd()        != null) { update.set(o.apprStatusCd,        entity.getApprStatusCd());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(o.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(o.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(o.orderId.eq(entity.getOrderId())).execute();
        return (int) affected;
    }
}
