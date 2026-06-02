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
    private static final QOdPay    odPay   = QOdPay.odPay;
    private static final QOdOrder  odOrder   = QOdOrder.odOrder;
    private static final QMbMember mbMember   = QMbMember.mbMember;
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
                        odPay.payId, odPay.siteId, odPay.orderId,
                        odPay.payStatusCd, odPay.payStatusCdBefore,
                        odPay.payMethodCd, odPay.payDirCd, odPay.payChannelCd,
                        odPay.payAmt, odPay.refundAmt, odPay.refundStatusCd, odPay.refundDate,
                        odPay.pgTransactionId, odPay.payDate,
                        odPay.cardNo, odPay.cardTypeCd,
                        odPay.installmentMonth.as("cardInstallMonth"),
                        odPay.vbankBankCode,
                        odPay.vbankAccount.as("vbankAccountNo"),
                        odPay.vbankHolderNm.as("vbankAccountNm"),
                        odPay.vbankDepositDate.as("vbankExpireDate"),
                        odPay.memo, odPay.regBy, odPay.regDate, odPay.updBy, odPay.updDate,
                        // joined
                        odOrder.memberNm.as("memberNm"),
                        odOrder.orderDate.as("orderDate"),
                        odOrder.orderStatusCd.as("orderStatusCd"),
                        mbMember.loginId.as("memberEmail"),
                        cdPs.codeLabel.as("payStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdPd.codeLabel.as("payDirCdNm"),
                        cdPc.codeLabel.as("payChannelCdNm"),
                        cdRs.codeLabel.as("refundStatusCdNm"),
                        cdVb.codeLabel.as("vbankBankCodeNm"),
                        cdCt.codeLabel.as("cardTypeCdNm")
                ))
                .from(odPay)
                .leftJoin(odOrder).on(odOrder.orderId.eq(odPay.orderId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(odOrder.memberId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PAY_STATUS").and(cdPs.codeValue.eq(odPay.payStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(odPay.payMethodCd)))
                .leftJoin(cdPd).on(cdPd.codeGrp.eq("PAY_DIR").and(cdPd.codeValue.eq(odPay.payDirCd)))
                .leftJoin(cdPc).on(cdPc.codeGrp.eq("PAY_CHANNEL").and(cdPc.codeValue.eq(odPay.payChannelCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(odPay.refundStatusCd)))
                .leftJoin(cdVb).on(cdVb.codeGrp.eq("BANK_CODE").and(cdVb.codeValue.eq(odPay.vbankBankCode)))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CARD_TYPE").and(cdCt.codeValue.eq(odPay.cardTypeCd)))
                .where(odPay.payId.eq(payId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 결제 목록조회 */
    @Override
    public List<OdPayDto.Item> selectList(OdPayDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayDto.Item> query = baseListQuery().where(
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndPayId(search),
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

    /* 결제 페이지조회 */
    @Override
    public OdPayDto.PageResponse selectPageData(OdPayDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayDto.Item> query = baseListQuery().where(
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndPayId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdPayDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(odPay.count())
                .from(odPay)
                .leftJoin(odOrder).on(odOrder.orderId.eq(odPay.orderId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(odOrder.memberId))
                .where(
                baseAndOrderIds(search),
                baseAndOrderId(search),
                baseAndSiteId(search),
                baseAndPayId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        OdPayDto.PageResponse res = new OdPayDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdPayDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdPayDto.Item.class,
                        odPay.payId, odPay.siteId, odPay.orderId,
                        odPay.payStatusCd, odPay.payStatusCdBefore,
                        odPay.payMethodCd, odPay.payDirCd, odPay.payChannelCd,
                        odPay.payAmt, odPay.refundAmt, odPay.refundStatusCd, odPay.refundDate,
                        odPay.pgTransactionId, odPay.payDate,
                        odPay.cardNo, odPay.cardTypeCd,
                        odPay.installmentMonth.as("cardInstallMonth"),
                        odPay.vbankBankCode,
                        odPay.vbankAccount.as("vbankAccountNo"),
                        odPay.vbankHolderNm.as("vbankAccountNm"),
                        odPay.vbankDepositDate.as("vbankExpireDate"),
                        odPay.memo, odPay.regBy, odPay.regDate, odPay.updBy, odPay.updDate,
                        odOrder.memberNm.as("memberNm"),
                        odOrder.orderDate.as("orderDate"),
                        mbMember.loginId.as("memberEmail"),
                        cdPs.codeLabel.as("payStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdPd.codeLabel.as("payDirCdNm"),
                        cdRs.codeLabel.as("refundStatusCdNm")
                ))
                .from(odPay)
                .leftJoin(odOrder).on(odOrder.orderId.eq(odPay.orderId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(odOrder.memberId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PAY_STATUS").and(cdPs.codeValue.eq(odPay.payStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(odPay.payMethodCd)))
                .leftJoin(cdPd).on(cdPd.codeGrp.eq("PAY_DIR").and(cdPd.codeValue.eq(odPay.payDirCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(odPay.refundStatusCd)));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* orderId IN */
    private BooleanExpression baseAndOrderIds(OdPayDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getOrderIds())
                ? odPay.orderId.in(search.getOrderIds()) : null;
    }

    /* orderId 정확 일치 */
    private BooleanExpression baseAndOrderId(OdPayDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? odPay.orderId.eq(search.getOrderId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdPayDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odPay.siteId.eq(search.getSiteId()) : null;
    }

    /* payId 정확 일치 */
    private BooleanExpression baseAndPayId(OdPayDto.Request search) {
        return search != null && StringUtils.hasText(search.getPayId())
                ? odPay.payId.eq(search.getPayId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdPayDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "pay_date": return odPay.payDate.goe(start).and(odPay.payDate.lt(endExcl));
            case "reg_date": return odPay.regDate.goe(start).and(odPay.regDate.lt(endExcl));
            case "upd_date": return odPay.updDate.goe(start).and(odPay.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdPayDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",cardIssuerCd,", odPay.cardIssuerCd, pattern);
        or = orLike(or, all, types, ",cardIssuerNm,", odPay.cardIssuerNm, pattern);
        or = orLike(or, all, types, ",cardNo,", odPay.cardNo, pattern);
        or = orLike(or, all, types, ",cardTypeCd,", odPay.cardTypeCd, pattern);
        or = orLike(or, all, types, ",claimId,", odPay.claimId, pattern);
        or = orLike(or, all, types, ",failureCode,", odPay.failureCode, pattern);
        or = orLike(or, all, types, ",failureReason,", odPay.failureReason, pattern);
        or = orLike(or, all, types, ",memo,", odPay.memo, pattern);
        or = orLike(or, all, types, ",orderId,", odPay.orderId, pattern);
        or = orLike(or, all, types, ",payChannelCd,", odPay.payChannelCd, pattern);
        or = orLike(or, all, types, ",payDirCd,", odPay.payDirCd, pattern);
        or = orLike(or, all, types, ",payDivCd,", odPay.payDivCd, pattern);
        or = orLike(or, all, types, ",payId,", odPay.payId, pattern);
        or = orLike(or, all, types, ",payMethodCd,", odPay.payMethodCd, pattern);
        or = orLike(or, all, types, ",payOccurTypeCd,", odPay.payOccurTypeCd, pattern);
        or = orLike(or, all, types, ",payStatusCd,", odPay.payStatusCd, pattern);
        or = orLike(or, all, types, ",payStatusCdBefore,", odPay.payStatusCdBefore, pattern);
        or = orLike(or, all, types, ",pgApprovalNo,", odPay.pgApprovalNo, pattern);
        or = orLike(or, all, types, ",pgCompanyCd,", odPay.pgCompanyCd, pattern);
        or = orLike(or, all, types, ",pgResponse,", odPay.pgResponse, pattern);
        or = orLike(or, all, types, ",pgTransactionId,", odPay.pgTransactionId, pattern);
        or = orLike(or, all, types, ",refundReason,", odPay.refundReason, pattern);
        or = orLike(or, all, types, ",refundStatusCd,", odPay.refundStatusCd, pattern);
        or = orLike(or, all, types, ",refundStatusCdBefore,", odPay.refundStatusCdBefore, pattern);
        or = orLike(or, all, types, ",siteId,", odPay.siteId, pattern);
        or = orLike(or, all, types, ",vbankAccount,", odPay.vbankAccount, pattern);
        or = orLike(or, all, types, ",vbankBankCode,", odPay.vbankBankCode, pattern);
        or = orLike(or, all, types, ",vbankBankNm,", odPay.vbankBankNm, pattern);
        or = orLike(or, all, types, ",vbankDepositNm,", odPay.vbankDepositNm, pattern);
        or = orLike(or, all, types, ",vbankHolderNm,", odPay.vbankHolderNm, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, odPay.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odPay.payId));
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
                    orders.add(new OrderSpecifier(order, odPay.payId));
                } else if ("vbankBankNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, odPay.vbankBankNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odPay.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odPay.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odPay.payId));
        }
        return orders;
    }

    /* 결제 수정 */
    @Override
    public int updateSelective(OdPay entity) {
        if (entity.getPayId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odPay);
        boolean hasAny = false;

        if (entity.getPayStatusCd()       != null) { update.set(odPay.payStatusCd,       entity.getPayStatusCd());       hasAny = true; }
        if (entity.getPayStatusCdBefore() != null) { update.set(odPay.payStatusCdBefore, entity.getPayStatusCdBefore()); hasAny = true; }
        if (entity.getPayDate()           != null) { update.set(odPay.payDate,           entity.getPayDate());           hasAny = true; }
        if (entity.getRefundAmt()         != null) { update.set(odPay.refundAmt,         entity.getRefundAmt());         hasAny = true; }
        if (entity.getRefundStatusCd()    != null) { update.set(odPay.refundStatusCd,    entity.getRefundStatusCd());    hasAny = true; }
        if (entity.getRefundDate()        != null) { update.set(odPay.refundDate,        entity.getRefundDate());        hasAny = true; }
        if (entity.getMemo()              != null) { update.set(odPay.memo,              entity.getMemo());              hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(odPay.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odPay.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odPay.payId.eq(entity.getPayId())).execute();
        return (int) affected;
    }
}
