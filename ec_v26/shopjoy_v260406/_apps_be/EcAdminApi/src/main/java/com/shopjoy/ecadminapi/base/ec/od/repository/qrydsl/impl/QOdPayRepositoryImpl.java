package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
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
    private static final QVwSyCode   cdPs = new QVwSyCode("cd_ps");
    private static final QVwSyCode   cdPm = new QVwSyCode("cd_pm");
    private static final QVwSyCode   cdPd = new QVwSyCode("cd_pd");
    private static final QVwSyCode   cdPc = new QVwSyCode("cd_pc");
    private static final QVwSyCode   cdRs = new QVwSyCode("cd_rs");
    private static final QVwSyCode   cdVb = new QVwSyCode("cd_vb");
    private static final QVwSyCode   cdCt = new QVwSyCode("cd_ct");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("pay_date", odPay.payDate,
        "reg_date", odPay.regDate,
        "upd_date", odPay.updDate
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * PAY_STATUS  {PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불}
     * PAY_METHOD  {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
     * PAY_DIR     {DEPOSIT:입금, REFUND:환불}
     * REFUND_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패}
     */
    private JPAQuery<OdPayDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdPayDto.Item.class,
                        odPay.payId,                 // 결제ID (YYMMDDhhmmss+rand4)
                        odPay.orderId,                // 주문ID (od_order.)
                        odPay.payStatusCd,            // 결제상태 — PAY_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불}
                        odPay.payStatusCdBefore,      // 변경 전 결제상태 — PAY_STATUS (동일 코드그룹)
                        odPay.payMethodCd,            // 결제수단 — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
                        odPay.payDirCd,               // 입금/환불 방향 — PAY_DIR {DEPOSIT:입금, REFUND:환불}
                        odPay.payChannelCd,           // 결제채널 — PAY_CHANNEL {CARD:신용카드, ACCOUNT:계좌이체, KAKAO:카카오페이, NAVER:네이버페이} (TOSS만 해당)
                        odPay.payAmt,                 // 결제 금액
                        odPay.refundAmt,              // 환불 금액
                        odPay.refundStatusCd,         // 환불 상태 — REFUND_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패}
                        odPay.refundDate,             // 환불 완료일시
                        odPay.pgTransactionId,        // PG 거래ID
                        odPay.payDate,                // 결제 완료일시
                        odPay.cardNo,                 // 카드번호 (마스킹: ****-****-****-5678)
                        odPay.cardTypeCd,             // 카드 타입 — CARD_TYPE {CREDIT:신용카드, DEBIT:체크카드, CHECK:직불카드}
                        odPay.installmentMonth.as("cardInstallMonth"),  // 할부 개월수 (0=일시불)
                        odPay.vbankBankCode,          // 가상계좌 은행코드 — BANK_CODE
                        odPay.vbankAccount.as("vbankAccountNo"),      // 가상계좌 계좌번호
                        odPay.vbankHolderNm.as("vbankAccountNm"),     // 가상계좌 예금주명
                        odPay.vbankDepositDate.as("vbankExpireDate"), // 가상계좌 입금확인일시
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

    /*
     * selectById — 코드성 필드는 baseListQuery 와 동일 코드그룹
     * + 상세조회 전용 추가 조인: payChannelCd→PAY_CHANNEL, vbankBankCode→BANK_CODE, cardTypeCd→CARD_TYPE
     */
    /* 결제 키조회 */
    @Override
    public Optional<OdPayDto.Item> selectById(String payId) {
        OdPayDto.Item dto = queryFactory
                .select(Projections.bean(OdPayDto.Item.class,
                        odPay.payId,                  // 결제ID (YYMMDDhhmmss+rand4)
                        odPay.orderId,                 // 주문ID (od_order.)
                        odPay.payStatusCd,             // 결제상태 — PAY_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불}
                        odPay.payStatusCdBefore,       // 변경 전 결제상태 — PAY_STATUS (동일 코드그룹)
                        odPay.payMethodCd,             // 결제수단 — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
                        odPay.payDirCd,                // 입금/환불 방향 — PAY_DIR {DEPOSIT:입금, REFUND:환불}
                        odPay.payChannelCd,            // 결제채널 — PAY_CHANNEL {CARD:신용카드, ACCOUNT:계좌이체, KAKAO:카카오페이, NAVER:네이버페이}
                        odPay.payAmt,                  // 결제 금액
                        odPay.refundAmt,               // 환불 금액
                        odPay.refundStatusCd,          // 환불 상태 — REFUND_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패}
                        odPay.refundDate,              // 환불 완료일시
                        odPay.pgTransactionId,         // PG 거래ID
                        odPay.payDate,                 // 결제 완료일시
                        odPay.cardNo,                  // 카드번호 (마스킹)
                        odPay.cardTypeCd,              // 카드 타입 — CARD_TYPE {CREDIT:신용카드, DEBIT:체크카드, CHECK:직불카드}
                        odPay.installmentMonth.as("cardInstallMonth"),  // 할부 개월수 (0=일시불)
                        odPay.vbankBankCode,           // 가상계좌 은행코드 — BANK_CODE
                        odPay.vbankAccount.as("vbankAccountNo"),      // 가상계좌 계좌번호
                        odPay.vbankHolderNm.as("vbankAccountNm"),     // 가상계좌 예금주명
                        odPay.vbankDepositDate.as("vbankExpireDate"), // 가상계좌 입금확인일시
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<OdPayDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(odPay.orderId, search.getOrderIds()),
                    QdslUtil.strEq(odPay.orderId, search.getOrderId()),
                    QdslUtil.strEq(odPay.payId, search.getPayId()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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
    public BasePage<OdPayDto.Item> selectPageData(OdPayDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strIn(odPay.orderId, search.getOrderIds()),
                QdslUtil.strEq(odPay.orderId, search.getOrderId()),
                QdslUtil.strEq(odPay.payId, search.getPayId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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

        BasePage<OdPayDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("cardIssuerCd", odPay.cardIssuerCd),
            QdslUtil.FieldDef.like("cardIssuerNm", odPay.cardIssuerNm),
            QdslUtil.FieldDef.like("cardNo", odPay.cardNo),
            QdslUtil.FieldDef.like("cardTypeCd", odPay.cardTypeCd),
            QdslUtil.FieldDef.like("claimId", odPay.claimId),
            QdslUtil.FieldDef.like("failureCode", odPay.failureCode),
            QdslUtil.FieldDef.like("failureReason", odPay.failureReason),
            QdslUtil.FieldDef.like("memo", odPay.memo),
            QdslUtil.FieldDef.like("orderId", odPay.orderId),
            QdslUtil.FieldDef.like("payChannelCd", odPay.payChannelCd),
            QdslUtil.FieldDef.like("payDirCd", odPay.payDirCd),
            QdslUtil.FieldDef.like("payDivCd", odPay.payDivCd),
            QdslUtil.FieldDef.like("payId", odPay.payId),
            QdslUtil.FieldDef.like("payMethodCd", odPay.payMethodCd),
            QdslUtil.FieldDef.like("payOccurTypeCd", odPay.payOccurTypeCd),
            QdslUtil.FieldDef.like("payStatusCd", odPay.payStatusCd),
            QdslUtil.FieldDef.like("payStatusCdBefore", odPay.payStatusCdBefore),
            QdslUtil.FieldDef.like("pgApprovalNo", odPay.pgApprovalNo),
            QdslUtil.FieldDef.like("pgCompanyCd", odPay.pgCompanyCd),
            QdslUtil.FieldDef.like("pgResponse", odPay.pgResponse),
            QdslUtil.FieldDef.like("pgTransactionId", odPay.pgTransactionId),
            QdslUtil.FieldDef.like("refundReason", odPay.refundReason),
            QdslUtil.FieldDef.like("refundStatusCd", odPay.refundStatusCd),
            QdslUtil.FieldDef.like("refundStatusCdBefore", odPay.refundStatusCdBefore),
            QdslUtil.FieldDef.like("vbankAccount", odPay.vbankAccount),
            QdslUtil.FieldDef.like("vbankBankCode", odPay.vbankBankCode),
            QdslUtil.FieldDef.like("vbankBankNm", odPay.vbankBankNm),
            QdslUtil.FieldDef.like("vbankDepositNm", odPay.vbankDepositNm),
            QdslUtil.FieldDef.like("vbankHolderNm", odPay.vbankHolderNm)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("payId", odPay.payId,
                   "vbankBankNm", odPay.vbankBankNm,
                   "regDate", odPay.regDate),
        new OrderSpecifier<>(Order.DESC, odPay.regDate),
        new OrderSpecifier<>(Order.ASC, odPay.payId));
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
