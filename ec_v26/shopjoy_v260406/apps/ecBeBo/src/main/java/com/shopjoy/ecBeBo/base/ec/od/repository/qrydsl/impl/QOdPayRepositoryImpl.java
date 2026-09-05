package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdPay;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.QOdPay;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdPayRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;

/** OdPay(결제 (주문당 N건 결제 가능 — 분할결제)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdPayRepositoryImpl implements QOdPayRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdPayRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdPay    odPay   = QOdPay.odPay;
    private static final QOdOrder  odOrder   = QOdOrder.odOrder;
    private static final QMbMember mbMember   = QMbMember.mbMember;
    private static final QVwSyCode   codePayStatusCd = new QVwSyCode("cd_ps");
    private static final QVwSyCode   codePayMethodCd = new QVwSyCode("cd_pm");
    private static final QVwSyCode   codePayDirCd = new QVwSyCode("cd_pd");
    private static final QVwSyCode   codePayChannelCd = new QVwSyCode("cd_pc");
    private static final QVwSyCode   codeRefundStatusCd = new QVwSyCode("cd_rs");
    private static final QVwSyCode   codeVbankBankCd = new QVwSyCode("cd_vb");
    private static final QVwSyCode   codeCardTypeCd = new QVwSyCode("cd_ct");    /*
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
                        odPay.vbankBankCd,          // 가상계좌 은행코드 — BANK_CODE
                        odPay.vbankAccount.as("vbankAccountNo"),      // 가상계좌 계좌번호
                        odPay.vbankHolderNm.as("vbankAccountNm"),     // 가상계좌 예금주명
                        odPay.vbankDepositDate.as("vbankExpireDate"), // 가상계좌 입금확인일시
                        odPay.memo,  // 메모
                        odPay.regBy,  // 등록자
                        odPay.regDate,  // 등록일시
                        odPay.updBy,  // 수정자
                        odPay.updDate,  // 수정일시
                        odOrder.memberNm.as("memberNm"), // 회원명 (조인 표시용)
                        odOrder.orderDate.as("orderDate"), // 주문일시 (od_order 조인)
                        mbMember.loginId.as("memberEmail"), // 회원 이메일 (mb_member 조인)
                        codePayStatusCd.codeLabel.as("payStatusCdNm"), // 결제상태 코드 라벨
                        codePayMethodCd.codeLabel.as("payMethodCdNm"), // 결제수단 코드 라벨
                        codePayDirCd.codeLabel.as("payDirCdNm"), // 입금/환불방향 코드 라벨
                        codeRefundStatusCd.codeLabel.as("refundStatusCdNm"), // 환불상태 코드 라벨
                        odPay.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        odPay.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(odPay)
                .innerJoin(odOrder).on(odOrder.orderId.eq(odPay.orderId)) // 주문
                .innerJoin(mbMember).on(mbMember.memberId.eq(odOrder.memberId)) // 회원
                .innerJoin(codePayMethodCd).on(codePayMethodCd.codeGrp.eq("PAY_METHOD").and(codePayMethodCd.codeValue.eq(odPay.payMethodCd))) // 결제수단
                .leftJoin(codePayStatusCd).on(codePayStatusCd.codeGrp.eq("PAY_STATUS").and(codePayStatusCd.codeValue.eq(odPay.payStatusCd))) // 결제상태
                .leftJoin(codePayDirCd).on(codePayDirCd.codeGrp.eq("PAY_DIR_CD").and(codePayDirCd.codeValue.eq(odPay.payDirCd))) // 결제방향
                .leftJoin(codeRefundStatusCd).on(codeRefundStatusCd.codeGrp.eq("REFUND_STATUS_CD").and(codeRefundStatusCd.codeValue.eq(odPay.refundStatusCd))) // 환불상태
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odPay.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odPay.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(odPay.siteId)) // 사이트

                ;
    }

    /*
     * selectById — 코드성 필드는 baseListQuery 와 동일 코드그룹
     * + 상세조회 전용 추가 조인: payChannelCd→PAY_CHANNEL, vbankBankCd→BANK_CODE, cardTypeCd→CARD_TYPE
     */
    /* 결제 키조회 */
    @Override
    public Optional<OdPayDto.Item> selectById(String payId) {
        OdPayDto.Item dtl = queryFactory
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
                        odPay.vbankBankCd,           // 가상계좌 은행코드 — BANK_CODE
                        odPay.vbankAccount.as("vbankAccountNo"),      // 가상계좌 계좌번호
                        odPay.vbankHolderNm.as("vbankAccountNm"),     // 가상계좌 예금주명
                        odPay.vbankDepositDate.as("vbankExpireDate"), // 가상계좌 입금확인일시
                        odPay.memo,  // 메모
                        odPay.regBy,  // 등록자
                        odPay.regDate,  // 등록일시
                        odPay.updBy,  // 수정자
                        odPay.updDate,  // 수정일시
                        // joined
                        odOrder.memberNm.as("memberNm"), // 회원명 (조인 표시용)
                        odOrder.orderDate.as("orderDate"), // 주문일시 (od_order 조인)
                        odOrder.orderStatusCd.as("orderStatusCd"), // 주문상태 (od_order 조인) — ORDER_STATUS_CD
                        mbMember.loginId.as("memberEmail"), // 회원 이메일 (mb_member 조인)
                        codePayStatusCd.codeLabel.as("payStatusCdNm"), // 결제상태 코드 라벨
                        codePayMethodCd.codeLabel.as("payMethodCdNm"), // 결제수단 코드 라벨
                        codePayDirCd.codeLabel.as("payDirCdNm"), // 입금/환불방향 코드 라벨
                        codePayChannelCd.codeLabel.as("payChannelCdNm"), // 결제채널 코드 라벨
                        codeRefundStatusCd.codeLabel.as("refundStatusCdNm"), // 환불상태 코드 라벨
                        codeVbankBankCd.codeLabel.as("vbankBankCdNm"), // 가상계좌은행 코드 라벨
                        codeCardTypeCd.codeLabel.as("cardTypeCdNm"), // 카드유형 코드 라벨
                        odPay.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        odPay.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").from(odPay)
                .innerJoin(odOrder).on(odOrder.orderId.eq(odPay.orderId)) // 주문
                .innerJoin(mbMember).on(mbMember.memberId.eq(odOrder.memberId)) // 회원
                .innerJoin(codePayMethodCd).on(codePayMethodCd.codeGrp.eq("PAY_METHOD").and(codePayMethodCd.codeValue.eq(odPay.payMethodCd))) // 결제수단
                .leftJoin(codePayStatusCd).on(codePayStatusCd.codeGrp.eq("PAY_STATUS").and(codePayStatusCd.codeValue.eq(odPay.payStatusCd))) // 결제상태
                .leftJoin(codePayDirCd).on(codePayDirCd.codeGrp.eq("PAY_DIR_CD").and(codePayDirCd.codeValue.eq(odPay.payDirCd))) // 결제방향
                .leftJoin(codePayChannelCd).on(codePayChannelCd.codeGrp.eq("PAY_CHANNEL_CD").and(codePayChannelCd.codeValue.eq(odPay.payChannelCd))) // 결제채널
                .leftJoin(codeRefundStatusCd).on(codeRefundStatusCd.codeGrp.eq("REFUND_STATUS_CD").and(codeRefundStatusCd.codeValue.eq(odPay.refundStatusCd))) // 환불상태
                .leftJoin(codeVbankBankCd).on(codeVbankBankCd.codeGrp.eq("BANK_CODE").and(codeVbankBankCd.codeValue.eq(odPay.vbankBankCd))) // 은행
                .leftJoin(codeCardTypeCd).on(codeCardTypeCd.codeGrp.eq("CARD_TYPE_CD").and(codeCardTypeCd.codeValue.eq(odPay.cardTypeCd))) // 카드유형
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odPay.regSiteId)) // 등록사이트
                .leftJoin(siteEx).on(siteEx.siteId.eq(odPay.siteId)) // 사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odPay.regBy)) // 등록자
                .where(odPay.payId.eq(payId))
                .fetchOne()
                ;
        return Optional.ofNullable(dtl);
    }

    /* 결제 목록조회 */
    @Override
    public List<OdPayDto.Item> selectList(OdPayDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(odPay.orderId, search.getOrderIds())); // 상위 FK 다건 IN
        whereList.add(QdslUtil.strEq(odPay.orderId, search.getOrderId())); // 상위 FK 필터
        whereList.add(QdslUtil.strEq(odPay.payId, search.getPayId())); // 결제ID 필터
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPay.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPay.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("pay_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPay.payDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(odPay.siteId, search.getSiteId())); // 사이트ID 필터

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdPayDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<OdPayDto.Item> list = query.fetch();
        return list;
    }

    /* 결제 페이지조회 */
    @Override
    public BasePage<OdPayDto.Item> selectPageData(OdPayDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(odPay.orderId, search.getOrderIds())); // 상위 FK 다건 IN
        whereList.add(QdslUtil.strEq(odPay.orderId, search.getOrderId())); // 상위 FK 필터
        whereList.add(QdslUtil.strEq(odPay.payId, search.getPayId())); // 결제ID 필터
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPay.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPay.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("pay_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPay.payDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(odPay.siteId, search.getSiteId())); // 사이트ID 필터
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<OdPayDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdPayDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odPay.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdPayDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "cardIssuerCd,cardIssuerNm,cardNo,cardTypeCd,claimId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("cardIssuerCd", odPay.cardIssuerCd),
            QdslUtil.FieldDef.like("cardIssuerNm", odPay.cardIssuerNm),
            QdslUtil.FieldDef.like("cardNo", odPay.cardNo), // 카드번호 (마스킹: ****-****-****-5678)
            QdslUtil.FieldDef.like("cardTypeCd", odPay.cardTypeCd), // 카드 타입 — CARD_TYPE_CD {CREDIT:신용카드, DEBIT:체크카드, CHECK:직불카드}
            QdslUtil.FieldDef.like("claimId", odPay.claimId),
            QdslUtil.FieldDef.like("failureCode", odPay.failureCode),
            QdslUtil.FieldDef.like("failureReason", odPay.failureReason),
            QdslUtil.FieldDef.like("memo", odPay.memo), // 메모
            QdslUtil.FieldDef.like("orderId", odPay.orderId), // 상위 FK 필터
            QdslUtil.FieldDef.like("payChannelCd", odPay.payChannelCd), // 결제채널 — PAY_CHANNEL_CD
            QdslUtil.FieldDef.like("payDirCd", odPay.payDirCd), // 입금/환불 방향 — PAY_DIR_CD {DEPOSIT:입금, REFUND:환불}
            QdslUtil.FieldDef.like("payDivCd", odPay.payDivCd),
            QdslUtil.FieldDef.like("payId", odPay.payId), // 결제ID 필터
            QdslUtil.FieldDef.like("payMethodCd", odPay.payMethodCd), // 결제수단 — PAY_METHOD
            QdslUtil.FieldDef.like("payOccurTypeCd", odPay.payOccurTypeCd),
            QdslUtil.FieldDef.like("payStatusCd", odPay.payStatusCd), // 결제상태 — PAY_STATUS
            QdslUtil.FieldDef.like("payStatusCdBefore", odPay.payStatusCdBefore), // 변경 전 결제상태 — PAY_STATUS
            QdslUtil.FieldDef.like("pgApprovalNo", odPay.pgApprovalNo),
            QdslUtil.FieldDef.like("pgCompanyCd", odPay.pgCompanyCd),
            QdslUtil.FieldDef.like("pgResponse", odPay.pgResponse),
            QdslUtil.FieldDef.like("pgTransactionId", odPay.pgTransactionId), // PG 거래ID
            QdslUtil.FieldDef.like("refundReason", odPay.refundReason),
            QdslUtil.FieldDef.like("refundStatusCd", odPay.refundStatusCd), // 환불 상태 — REFUND_STATUS_CD {PENDING:대기, COMPLT:완료, FAILED:실패}
            QdslUtil.FieldDef.like("refundStatusCdBefore", odPay.refundStatusCdBefore),
            QdslUtil.FieldDef.like("vbankAccount", odPay.vbankAccount),
            QdslUtil.FieldDef.like("vbankBankCd", odPay.vbankBankCd), // 가상계좌 은행코드
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
        update.set(odPay.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odPay.payId.eq(entity.getPayId())).execute();
        return (int) affected;
    }
}
