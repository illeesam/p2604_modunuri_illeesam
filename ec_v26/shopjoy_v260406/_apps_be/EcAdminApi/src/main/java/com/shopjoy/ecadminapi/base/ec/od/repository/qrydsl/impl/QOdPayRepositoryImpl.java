package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "pay_date", odPay.payDate,
        "reg_date", odPay.regDate,
        "upd_date", odPay.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("cardIssuerCd", odPay.cardIssuerCd),
        Map.entry("cardIssuerNm", odPay.cardIssuerNm),
        Map.entry("cardNo", odPay.cardNo),
        Map.entry("cardTypeCd", odPay.cardTypeCd),
        Map.entry("claimId", odPay.claimId),
        Map.entry("failureCode", odPay.failureCode),
        Map.entry("failureReason", odPay.failureReason),
        Map.entry("memo", odPay.memo),
        Map.entry("orderId", odPay.orderId),
        Map.entry("payChannelCd", odPay.payChannelCd),
        Map.entry("payDirCd", odPay.payDirCd),
        Map.entry("payDivCd", odPay.payDivCd),
        Map.entry("payId", odPay.payId),
        Map.entry("payMethodCd", odPay.payMethodCd),
        Map.entry("payOccurTypeCd", odPay.payOccurTypeCd),
        Map.entry("payStatusCd", odPay.payStatusCd),
        Map.entry("payStatusCdBefore", odPay.payStatusCdBefore),
        Map.entry("pgApprovalNo", odPay.pgApprovalNo),
        Map.entry("pgCompanyCd", odPay.pgCompanyCd),
        Map.entry("pgResponse", odPay.pgResponse),
        Map.entry("pgTransactionId", odPay.pgTransactionId),
        Map.entry("refundReason", odPay.refundReason),
        Map.entry("refundStatusCd", odPay.refundStatusCd),
        Map.entry("refundStatusCdBefore", odPay.refundStatusCdBefore),
        Map.entry("siteId", odPay.siteId),
        Map.entry("vbankAccount", odPay.vbankAccount),
        Map.entry("vbankBankCode", odPay.vbankBankCode),
        Map.entry("vbankBankNm", odPay.vbankBankNm),
        Map.entry("vbankDepositNm", odPay.vbankDepositNm),
        Map.entry("vbankHolderNm", odPay.vbankHolderNm)
    );

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
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").from(odPay)
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

        JPAQuery<OdPayDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(odPay.orderId, search.getOrderIds()),
                    QdslUtil.strEq(odPay.orderId, search.getOrderId()),
                    QdslUtil.strEq(odPay.siteId, search.getSiteId()),
                    QdslUtil.strEq(odPay.payId, search.getPayId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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

    /* 결제 페이지조회 */
    @Override
    public OdPayDto.PageResponse selectPageData(OdPayDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(odPay.orderId, search.getOrderIds()),
                QdslUtil.strEq(odPay.orderId, search.getOrderId()),
                QdslUtil.strEq(odPay.siteId, search.getSiteId()),
                QdslUtil.strEq(odPay.payId, search.getPayId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdPayDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdPayDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odPay.count())
                .where(wheres)
                .fetchOne();

        OdPayDto.PageResponse res = new OdPayDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdPayDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
