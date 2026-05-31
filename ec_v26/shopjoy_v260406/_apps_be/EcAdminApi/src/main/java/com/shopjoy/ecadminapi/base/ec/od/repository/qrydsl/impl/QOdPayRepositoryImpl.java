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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPay;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdPay;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdPayRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdPay QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdPayRepositoryImpl implements QOdPayRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdPayRepositoryImpl";
    private static final QOdPay    p   = QOdPay.odPay;
    private static final QOdOrder  o   = QOdOrder.odOrder;
    private static final QMbMember m   = QMbMember.mbMember;
    private static final QSyCode   cdPs = new QSyCode("cd_ps");
    private static final QSyCode   cdPm = new QSyCode("cd_pm");
    private static final QSyCode   cdPd = new QSyCode("cd_pd");
    private static final QSyCode   cdPc = new QSyCode("cd_pc");
    private static final QSyCode   cdRs = new QSyCode("cd_rs");
    private static final QSyCode   cdVb = new QSyCode("cd_vb");
    private static final QSyCode   cdCt = new QSyCode("cd_ct");

    /* 결제 키조회 */
    @Override
    public Optional<OdPayDto.Item> selectById(String payId) {
        OdPayDto.Item dto = queryFactory
                .select(Projections.bean(OdPayDto.Item.class,
                        p.payId, p.siteId, p.orderId,
                        p.payStatusCd, p.payStatusCdBefore,
                        p.payMethodCd, p.payDirCd, p.payChannelCd,
                        p.payAmt, p.refundAmt, p.refundStatusCd, p.refundDate,
                        p.pgTransactionId, p.payDate,
                        p.cardNo, p.cardTypeCd,
                        p.installmentMonth.as("cardInstallMonth"),
                        p.vbankBankCode,
                        p.vbankAccount.as("vbankAccountNo"),
                        p.vbankHolderNm.as("vbankAccountNm"),
                        p.vbankDepositDate.as("vbankExpireDate"),
                        p.memo, p.regBy, p.regDate, p.updBy, p.updDate,
                        // joined
                        o.memberNm.as("memberNm"),
                        o.orderDate.as("orderDate"),
                        o.orderStatusCd.as("orderStatusCd"),
                        m.loginId.as("memberEmail"),
                        cdPs.codeLabel.as("payStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdPd.codeLabel.as("payDirCdNm"),
                        cdPc.codeLabel.as("payChannelCdNm"),
                        cdRs.codeLabel.as("refundStatusCdNm"),
                        cdVb.codeLabel.as("vbankBankCodeNm"),
                        cdCt.codeLabel.as("cardTypeCdNm")
                ))
                .from(p)
                .leftJoin(o).on(o.orderId.eq(p.orderId))
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PAY_STATUS").and(cdPs.codeValue.eq(p.payStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(p.payMethodCd)))
                .leftJoin(cdPd).on(cdPd.codeGrp.eq("PAY_DIR").and(cdPd.codeValue.eq(p.payDirCd)))
                .leftJoin(cdPc).on(cdPc.codeGrp.eq("PAY_CHANNEL").and(cdPc.codeValue.eq(p.payChannelCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(p.refundStatusCd)))
                .leftJoin(cdVb).on(cdVb.codeGrp.eq("BANK_CODE").and(cdVb.codeValue.eq(p.vbankBankCode)))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CARD_TYPE").and(cdCt.codeValue.eq(p.cardTypeCd)))
                .where(p.payId.eq(payId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 결제 목록조회 */
    @Override
    public List<OdPayDto.Item> selectList(OdPayDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayDto.Item> query = baseListQuery().where(
                andOrderIds(search),
                andOrderId(search),
                andSiteId(search),
                andPayId(search),
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

    /* 결제 페이지조회 */
    @Override
    public OdPayDto.PageResponse selectPageList(OdPayDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayDto.Item> query = baseListQuery().where(
                andOrderIds(search),
                andOrderId(search),
                andSiteId(search),
                andPayId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdPayDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(p.count())
                .from(p)
                .leftJoin(o).on(o.orderId.eq(p.orderId))
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .where(
                andOrderIds(search),
                andOrderId(search),
                andSiteId(search),
                andPayId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        OdPayDto.PageResponse res = new OdPayDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdPayDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdPayDto.Item.class,
                        p.payId, p.siteId, p.orderId,
                        p.payStatusCd, p.payStatusCdBefore,
                        p.payMethodCd, p.payDirCd, p.payChannelCd,
                        p.payAmt, p.refundAmt, p.refundStatusCd, p.refundDate,
                        p.pgTransactionId, p.payDate,
                        p.cardNo, p.cardTypeCd,
                        p.installmentMonth.as("cardInstallMonth"),
                        p.vbankBankCode,
                        p.vbankAccount.as("vbankAccountNo"),
                        p.vbankHolderNm.as("vbankAccountNm"),
                        p.vbankDepositDate.as("vbankExpireDate"),
                        p.memo, p.regBy, p.regDate, p.updBy, p.updDate,
                        o.memberNm.as("memberNm"),
                        o.orderDate.as("orderDate"),
                        m.loginId.as("memberEmail"),
                        cdPs.codeLabel.as("payStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdPd.codeLabel.as("payDirCdNm"),
                        cdRs.codeLabel.as("refundStatusCdNm")
                ))
                .from(p)
                .leftJoin(o).on(o.orderId.eq(p.orderId))
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PAY_STATUS").and(cdPs.codeValue.eq(p.payStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(p.payMethodCd)))
                .leftJoin(cdPd).on(cdPd.codeGrp.eq("PAY_DIR").and(cdPd.codeValue.eq(p.payDirCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(p.refundStatusCd)));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* orderId IN */
    private BooleanExpression andOrderIds(OdPayDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getOrderIds())
                ? p.orderId.in(search.getOrderIds()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression andOrderId(OdPayDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? p.orderId.eq(search.getOrderId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdPayDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? p.siteId.eq(search.getSiteId()) : null;
    }

    /* payId 정확 일치 */
    private BooleanExpression andPayId(OdPayDto.Request search) {
        return search != null && StringUtils.hasText(search.getPayId())
                ? p.payId.eq(search.getPayId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(OdPayDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "pay_date": return p.payDate.goe(start).and(p.payDate.lt(endExcl));
            case "reg_date": return p.regDate.goe(start).and(p.regDate.lt(endExcl));
            case "upd_date": return p.updDate.goe(start).and(p.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdPayDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",cardIssuerCd,", p.cardIssuerCd, pattern);
        or = orLike(or, all, types, ",cardIssuerNm,", p.cardIssuerNm, pattern);
        or = orLike(or, all, types, ",cardNo,", p.cardNo, pattern);
        or = orLike(or, all, types, ",cardTypeCd,", p.cardTypeCd, pattern);
        or = orLike(or, all, types, ",claimId,", p.claimId, pattern);
        or = orLike(or, all, types, ",failureCode,", p.failureCode, pattern);
        or = orLike(or, all, types, ",failureReason,", p.failureReason, pattern);
        or = orLike(or, all, types, ",memo,", p.memo, pattern);
        or = orLike(or, all, types, ",orderId,", p.orderId, pattern);
        or = orLike(or, all, types, ",payChannelCd,", p.payChannelCd, pattern);
        or = orLike(or, all, types, ",payDirCd,", p.payDirCd, pattern);
        or = orLike(or, all, types, ",payDivCd,", p.payDivCd, pattern);
        or = orLike(or, all, types, ",payId,", p.payId, pattern);
        or = orLike(or, all, types, ",payMethodCd,", p.payMethodCd, pattern);
        or = orLike(or, all, types, ",payOccurTypeCd,", p.payOccurTypeCd, pattern);
        or = orLike(or, all, types, ",payStatusCd,", p.payStatusCd, pattern);
        or = orLike(or, all, types, ",payStatusCdBefore,", p.payStatusCdBefore, pattern);
        or = orLike(or, all, types, ",pgApprovalNo,", p.pgApprovalNo, pattern);
        or = orLike(or, all, types, ",pgCompanyCd,", p.pgCompanyCd, pattern);
        or = orLike(or, all, types, ",pgResponse,", p.pgResponse, pattern);
        or = orLike(or, all, types, ",pgTransactionId,", p.pgTransactionId, pattern);
        or = orLike(or, all, types, ",refundReason,", p.refundReason, pattern);
        or = orLike(or, all, types, ",refundStatusCd,", p.refundStatusCd, pattern);
        or = orLike(or, all, types, ",refundStatusCdBefore,", p.refundStatusCdBefore, pattern);
        or = orLike(or, all, types, ",siteId,", p.siteId, pattern);
        or = orLike(or, all, types, ",vbankAccount,", p.vbankAccount, pattern);
        or = orLike(or, all, types, ",vbankBankCode,", p.vbankBankCode, pattern);
        or = orLike(or, all, types, ",vbankBankNm,", p.vbankBankNm, pattern);
        or = orLike(or, all, types, ",vbankDepositNm,", p.vbankDepositNm, pattern);
        or = orLike(or, all, types, ",vbankHolderNm,", p.vbankHolderNm, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdPayDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.payId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("payId".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.payId));
                } else if ("vbankBankNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.vbankBankNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.payId));
        }
        return orders;
    }

    /* 결제 수정 */
    @Override
    public int updateSelective(OdPay entity) {
        if (entity.getPayId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getPayStatusCd()       != null) { update.set(p.payStatusCd,       entity.getPayStatusCd());       hasAny = true; }
        if (entity.getPayStatusCdBefore() != null) { update.set(p.payStatusCdBefore, entity.getPayStatusCdBefore()); hasAny = true; }
        if (entity.getPayDate()           != null) { update.set(p.payDate,           entity.getPayDate());           hasAny = true; }
        if (entity.getRefundAmt()         != null) { update.set(p.refundAmt,         entity.getRefundAmt());         hasAny = true; }
        if (entity.getRefundStatusCd()    != null) { update.set(p.refundStatusCd,    entity.getRefundStatusCd());    hasAny = true; }
        if (entity.getRefundDate()        != null) { update.set(p.refundDate,        entity.getRefundDate());        hasAny = true; }
        if (entity.getMemo()              != null) { update.set(p.memo,              entity.getMemo());              hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(p.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(p.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(p.payId.eq(entity.getPayId())).execute();
        return (int) affected;
    }
}
