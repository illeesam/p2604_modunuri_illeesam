package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdOrderRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.QPmCoupon;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;

/** OdOrder(주문) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderRepositoryImpl implements QOdOrderRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdOrderRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdOrder  odOrder   = QOdOrder.odOrder;
    private static final QMbMember mbMember   = QMbMember.mbMember;
    private static final QOdOrderItem odOrderItemCnt = new QOdOrderItem("ooi_cnt");   // 주문항목 수 집계 전용
    private static final QSySite   sySite   = QSySite.sySite;
    private static final QPmCoupon pmCoupon = QPmCoupon.pmCoupon;
    private static final QVwSyCode   codeOrderStatusCd = new QVwSyCode("cd_os");
    private static final QVwSyCode   codePayMethodCd = new QVwSyCode("cd_pm");
    private static final QVwSyCode   codeDlivStatusCd = new QVwSyCode("cd_ds");
    private static final QVwSyCode   codeRefundBankCd = new QVwSyCode("cd_rb");
    private static final QVwSyCode   codeApprStatusCd = new QVwSyCode("cd_ap");
    private static final QVwSyCode   codeApprTargetCd = new QVwSyCode("cd_at");
    private static final QVwSyCode   codeAccessChannelCd = new QVwSyCode("cd_ac");    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * ORDER_STATUS  {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소}
     * PAY_METHOD    {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
     * DLIV_STATUS   {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
     * ACCESS_CHANNEL {WEB_PC:Web-PC, WEB_MOBILE:모바일 웹, APP_IOS:앱-iOS, APP_ANDROID:앱-Android}
     * APPR_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료}
     */
    private JPAQuery<OdOrderDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        odOrder.orderId,               // 주문ID (YYMMDDhhmmss+rand4)
                        odOrder.memberId,              // 회원ID
                        odOrder.memberNm,              // 주문자명
                        odOrder.ordererEmail,          // 주문자 이메일 (주문 시점 스냅샷)
                        odOrder.totalAmt,              // 상품합계금액 (현재값)
                        odOrder.payAmt,                // 실결제금액 (현재값)
                        odOrder.orderStatusCd,         // 주문상태 — ORDER_STATUS {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소}
                        odOrder.orderStatusCdBefore,   // 변경 전 주문상태 — ORDER_STATUS (동일 코드그룹)
                        odOrder.payMethodCd,           // 결제수단 — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
                        odOrder.dlivStatusCd,          // 배송상태 최신 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
                        odOrder.couponId,              // 사용쿠폰ID
                        odOrder.recvNm,                // 수령자명
                        odOrder.recvPhone,             // 수령자연락처
                        odOrder.recvZip,               // 수령자우편번호
                        odOrder.recvAddr,              // 수령자주소
                        odOrder.recvAddrDetail,        // 수령자상세주소
                        odOrder.recvMemo,              // 배송메모
                        odOrder.refundBankCd,          // 환불 은행코드 — BANK_CODE (무통장/가상계좌 환불 시)
                        odOrder.refundAccountNo,       // 환불 계좌번호
                        odOrder.refundAccountNm,       // 환불 예금주명
                        odOrder.accessChannelCd,       // 주문유입경로 — ACCESS_CHANNEL {WEB_PC:Web-PC, WEB_MOBILE:모바일 웹, APP_IOS:앱-iOS, APP_ANDROID:앱-Android}
                        odOrder.apprStatusCd,          // 결재상태 — APPR_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료}
                        odOrder.apprStatusCdBefore,    // 변경 전 결재상태 — APPR_STATUS (동일 코드그룹)
                        odOrder.apprAmt,               // 결재 요청금액
                        odOrder.apprTargetCd,          // 결재대상 구분 — APPR_TARGET {ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결제}
                        odOrder.apprTargetNm,          // 결재 대상명
                        odOrder.apprReason,            // 사유/메모
                        odOrder.apprReqUserId,         // 결재 요청자 (sy_user.user_id)
                        odOrder.apprReqDate,           // 결재 요청일시
                        odOrder.apprAprvUserId,        // 결재자 (sy_user.user_id)
                        odOrder.apprAprvDate,          // 결재일시
                        odOrder.memo,                  // 관리메모
                        odOrder.orderDate,             // 주문일시
                        odOrder.regBy,      // 등록자
                        odOrder.regDate,    // 등록일시
                        odOrder.updBy,      // 수정자
                        odOrder.updDate,    // 수정일시
                        mbMember.loginId.as("memberEmail"), // 회원 이메일 (mb_member 조인)
                        pmCoupon.couponNm.as("couponNm"), // 사용쿠폰명 (pm_coupon 조인)
                        codeOrderStatusCd.codeLabel.as("orderStatusCdNm"), // 주문상태 코드 라벨
                        codePayMethodCd.codeLabel.as("payMethodCdNm"), // 결제수단 코드 라벨
                        codeDlivStatusCd.codeLabel.as("dlivStatusCdNm"), // 배송상태 코드 라벨
                        codeAccessChannelCd.codeLabel.as("accessChannelCdNm"), // 유입경로 코드 라벨
                        codeApprStatusCd.codeLabel.as("apprStatusCdNm"), // 결재상태 코드 라벨
                        /* 주문항목 수 — 목록은 orderItems 를 채우지 않으므로 건수만 상관 서브쿼리로 집계 */
                        ExpressionUtils.as(
                            Expressions.numberTemplate(Long.class, "COALESCE({0}, 0)",
                                JPAExpressions.select(odOrderItemCnt.count())
                                    .from(odOrderItemCnt)
                                    .where(odOrderItemCnt.orderId.eq(odOrder.orderId))),
                            "orderItemCnt"),
                        odOrder.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        odOrder.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(odOrder)
                .innerJoin(mbMember).on(mbMember.memberId.eq(odOrder.memberId)) // 회원
                .leftJoin(pmCoupon).on(pmCoupon.couponId.eq(odOrder.couponId)) // 쿠폰
                .leftJoin(codeOrderStatusCd).on(codeOrderStatusCd.codeGrp.eq("ORDER_STATUS_CD").and(codeOrderStatusCd.codeValue.eq(odOrder.orderStatusCd))) // 주문상태
                .leftJoin(codePayMethodCd).on(codePayMethodCd.codeGrp.eq("PAY_METHOD").and(codePayMethodCd.codeValue.eq(odOrder.payMethodCd))) // 결제수단
                .leftJoin(codeDlivStatusCd).on(codeDlivStatusCd.codeGrp.eq("DLIV_STATUS").and(codeDlivStatusCd.codeValue.eq(odOrder.dlivStatusCd))) // 배송상태
                .leftJoin(codeAccessChannelCd).on(codeAccessChannelCd.codeGrp.eq("ACCESS_CHANNEL_CD").and(codeAccessChannelCd.codeValue.eq(odOrder.accessChannelCd))) // 접근채널
                .leftJoin(codeApprStatusCd).on(codeApprStatusCd.codeGrp.eq("APPR_STATUS_CD").and(codeApprStatusCd.codeValue.eq(odOrder.apprStatusCd))) // 결재상태
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odOrder.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odOrder.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(odOrder.siteId)) // 사이트

                ;
    }

    /*
     * selectById — 코드성 필드 예시 코드값 (baseListQuery 와 동일 코드그룹, 상세조회 전용 별도 projection)
     * ORDER_STATUS {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소}
     * BANK_CODE {신한:신한은행, 국민:국민은행, 우리:우리은행, 농협:NH농협 등}
     * APPR_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료} / APPR_TARGET {ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결제}
     */
    /* 주문 키조회 */
    @Override
    public Optional<OdOrderDto.Item> selectById(String orderId) {
        OdOrderDto.Item dtl = queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        // a.* equivalent (DTO Item 에 존재하는 필드만)
                        odOrder.orderId,               // 주문ID (YYMMDDhhmmss+rand4)
                        odOrder.memberId,              // 회원ID
                        odOrder.memberNm,              // 주문자명
                        odOrder.ordererEmail,          // 주문자 이메일 (주문 시점 스냅샷)
                        odOrder.totalAmt,              // 상품합계금액 (현재값)
                        odOrder.payAmt,                // 실결제금액 (현재값)
                        odOrder.orderStatusCd,         // 주문상태 — ORDER_STATUS {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소}
                        odOrder.orderStatusCdBefore,   // 변경 전 주문상태 — ORDER_STATUS (동일 코드그룹)
                        odOrder.payMethodCd,           // 결제수단 — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
                        odOrder.dlivStatusCd,          // 배송상태 최신 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
                        odOrder.couponId,              // 사용쿠폰ID
                        odOrder.recvNm,                // 수령자명
                        odOrder.recvPhone,             // 수령자연락처
                        odOrder.recvZip,               // 수령자우편번호
                        odOrder.recvAddr,              // 수령자주소
                        odOrder.recvAddrDetail,        // 수령자상세주소
                        odOrder.recvMemo,              // 배송메모
                        odOrder.refundBankCd,          // 환불 은행코드 — BANK_CODE (예: 신한/국민/우리/농협 등)
                        odOrder.refundAccountNo,       // 환불 계좌번호
                        odOrder.refundAccountNm,       // 환불 예금주명
                        odOrder.accessChannelCd,       // 주문유입경로 — ACCESS_CHANNEL {WEB_PC:Web-PC, WEB_MOBILE:모바일 웹, APP_IOS:앱-iOS, APP_ANDROID:앱-Android}
                        odOrder.apprStatusCd,          // 결재상태 — APPR_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료}
                        odOrder.apprStatusCdBefore,    // 변경 전 결재상태 — APPR_STATUS (동일 코드그룹)
                        odOrder.apprAmt,               // 결재 요청금액
                        odOrder.apprTargetCd,          // 결재대상 구분 — APPR_TARGET {ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결제}
                        odOrder.apprTargetNm,          // 결재 대상명
                        odOrder.apprReason,            // 사유/메모
                        odOrder.apprReqUserId,         // 결재 요청자 (sy_user.user_id)
                        odOrder.apprReqDate,           // 결재 요청일시
                        odOrder.apprAprvUserId,        // 결재자 (sy_user.user_id)
                        odOrder.apprAprvDate,          // 결재일시
                        odOrder.memo,                  // 관리메모
                        odOrder.orderDate,             // 주문일시
                        odOrder.regBy,      // 등록자
                        odOrder.regDate,    // 등록일시
                        odOrder.updBy,      // 수정자
                        odOrder.updDate,    // 수정일시
                        // joined
                        mbMember.loginId.as("memberEmail"), // 회원 이메일 (mb_member 조인)
                        mbMember.memberPhone.as("memberPhoneOrigin"), // 회원 연락처 (mb_member 조인)
                        mbMember.gradeCd.as("gradeCd"), // 회원등급 (표시용)
                        mbMember.totalPurchaseAmt.as("totalPurchaseAmt"), // 회원 누적 구매금액 (조인/집계 표시용)
                        pmCoupon.couponNm.as("couponNm"), // 사용쿠폰명 (pm_coupon 조인)
                        pmCoupon.couponTypeCd.as("couponTypeCd"), // 사용쿠폰 유형 (pm_coupon 조인)
                        codeOrderStatusCd.codeLabel.as("orderStatusCdNm"), // 주문상태 코드 라벨
                        codePayMethodCd.codeLabel.as("payMethodCdNm"), // 결제수단 코드 라벨
                        codeDlivStatusCd.codeLabel.as("dlivStatusCdNm"), // 배송상태 코드 라벨
                        codeRefundBankCd.codeLabel.as("refundBankCdNm"), // 환불은행 코드 라벨
                        codeApprStatusCd.codeLabel.as("apprStatusCdNm"), // 결재상태 코드 라벨
                        codeApprTargetCd.codeLabel.as("apprTargetCdNm"), // 결재대상 코드 라벨
                        odOrder.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        odOrder.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").from(odOrder)
                .innerJoin(mbMember).on(mbMember.memberId.eq(odOrder.memberId)) // 회원
                .leftJoin(pmCoupon).on(pmCoupon.couponId.eq(odOrder.couponId)) // 쿠폰
                .leftJoin(codeOrderStatusCd).on(codeOrderStatusCd.codeGrp.eq("ORDER_STATUS_CD").and(codeOrderStatusCd.codeValue.eq(odOrder.orderStatusCd))) // 주문상태
                .leftJoin(codePayMethodCd).on(codePayMethodCd.codeGrp.eq("PAY_METHOD").and(codePayMethodCd.codeValue.eq(odOrder.payMethodCd))) // 결제수단
                .leftJoin(codeDlivStatusCd).on(codeDlivStatusCd.codeGrp.eq("DLIV_STATUS").and(codeDlivStatusCd.codeValue.eq(odOrder.dlivStatusCd))) // 배송상태
                .leftJoin(codeRefundBankCd).on(codeRefundBankCd.codeGrp.eq("BANK_CODE").and(codeRefundBankCd.codeValue.eq(odOrder.refundBankCd))) // 은행
                .leftJoin(codeApprStatusCd).on(codeApprStatusCd.codeGrp.eq("APPR_STATUS_CD").and(codeApprStatusCd.codeValue.eq(odOrder.apprStatusCd))) // 결재상태
                .leftJoin(codeApprTargetCd).on(codeApprTargetCd.codeGrp.eq("APPR_TARGET_CD").and(codeApprTargetCd.codeValue.eq(odOrder.apprTargetCd))) // 결재대상
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odOrder.regSiteId)) // 등록사이트
                .leftJoin(siteEx).on(siteEx.siteId.eq(odOrder.siteId)) // 사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odOrder.regBy)) // 등록자
                .where(odOrder.orderId.eq(orderId))
                .fetchOne()
                ;
        return Optional.ofNullable(dtl);
    }

    /* 주문 목록조회 */
    @Override
    public List<OdOrderDto.Item> selectList(OdOrderDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odOrder.orderId, search.getOrderId())); // 주문ID 필터
        whereList.add(QdslUtil.strEq(odOrder.memberId, search.getMemberId())); // 회원ID 필터
        whereList.add(QdslUtil.strEq(odOrder.orderStatusCd, search.getOrderStatusCd())); // 주문상태 단건 필터 (strEq)
        whereList.add(QdslUtil.strIn(odOrder.orderStatusCd, search.getOrderStatusCds())); // 주문상태 다중 필터 (strIn, BO multiCheck)
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("pay_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.payDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("dliv_ship_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.dlivShipDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("order_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.orderDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(odOrder.siteId, search.getSiteId())); // 사이트ID 필터

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdOrderDto.Item> query = baseListQuery()
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
        List<OdOrderDto.Item> list = query.fetch();
        return list;
    }

    /* 주문 페이지조회 */
    @Override
    public BasePage<OdOrderDto.Item> selectPageData(OdOrderDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odOrder.orderId, search.getOrderId())); // 주문ID 필터
        whereList.add(QdslUtil.strEq(odOrder.memberId, search.getMemberId())); // 회원ID 필터
        whereList.add(QdslUtil.strEq(odOrder.orderStatusCd, search.getOrderStatusCd())); // 주문상태 단건 필터 (strEq)
        whereList.add(QdslUtil.strIn(odOrder.orderStatusCd, search.getOrderStatusCds())); // 주문상태 다중 필터 (strIn, BO multiCheck)
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("pay_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.payDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("dliv_ship_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.dlivShipDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("order_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrder.orderDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(odOrder.siteId, search.getSiteId())); // 사이트ID 필터
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<OdOrderDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdOrderDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odOrder.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdOrderDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "accessChannelCd,apprAprvUserId,apprReason,apprReqUserId,apprStatusCd" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("accessChannelCd", odOrder.accessChannelCd), // 주문유입경로
            QdslUtil.FieldDef.like("apprAprvUserId", odOrder.apprAprvUserId), // 결재자 (sy_user.user_id)
            QdslUtil.FieldDef.like("apprReason", odOrder.apprReason), // 사유/메모
            QdslUtil.FieldDef.like("apprReqUserId", odOrder.apprReqUserId), // 결재 요청자 (sy_user.user_id)
            QdslUtil.FieldDef.like("apprStatusCd", odOrder.apprStatusCd), // 결재상태 — APPR_STATUS_CD
            QdslUtil.FieldDef.like("apprStatusCdBefore", odOrder.apprStatusCdBefore), // 변경 전 결재상태 — APPR_STATUS_CD
            QdslUtil.FieldDef.like("apprTargetCd", odOrder.apprTargetCd), // 결재대상 구분
            QdslUtil.FieldDef.like("apprTargetNm", odOrder.apprTargetNm), // 결재 대상명
            QdslUtil.FieldDef.like("couponId", odOrder.couponId), // 사용쿠폰ID
            QdslUtil.FieldDef.like("dlivCourierCd", odOrder.dlivCourierCd),
            QdslUtil.FieldDef.like("dlivStatusCd", odOrder.dlivStatusCd), // 배송상태 최신
            QdslUtil.FieldDef.like("dlivStatusCdBefore", odOrder.dlivStatusCdBefore),
            QdslUtil.FieldDef.like("dlivTrackingNo", odOrder.dlivTrackingNo),
            QdslUtil.FieldDef.like("entrancePwd", odOrder.entrancePwd),
            QdslUtil.FieldDef.like("memberId", odOrder.memberId), // 회원ID 필터
            QdslUtil.FieldDef.like("memberNm", odOrder.memberNm), // 주문자명
            QdslUtil.FieldDef.like("memo", odOrder.memo), // 관리메모
            QdslUtil.FieldDef.like("orderGradeCd", odOrder.orderGradeCd),
            QdslUtil.FieldDef.like("orderId", odOrder.orderId), // 주문ID 필터
            QdslUtil.FieldDef.like("orderStatusCd", odOrder.orderStatusCd), // 주문상태 단건 필터 (strEq)
            QdslUtil.FieldDef.like("orderStatusCdBefore", odOrder.orderStatusCdBefore), // 변경 전 주문상태 — ORDER_STATUS_CD
            QdslUtil.FieldDef.like("ordererEmail", odOrder.ordererEmail), // 주문자 이메일 (주문 시점 스냅샷)
            QdslUtil.FieldDef.like("payMethodCd", odOrder.payMethodCd), // 결제수단 — PAY_METHOD
            QdslUtil.FieldDef.like("recvAddr", odOrder.recvAddr), // 수령자주소
            QdslUtil.FieldDef.like("recvAddrDetail", odOrder.recvAddrDetail), // 수령자상세주소
            QdslUtil.FieldDef.like("recvMemo", odOrder.recvMemo), // 배송메모
            QdslUtil.FieldDef.like("recvNm", odOrder.recvNm), // 수령자명
            QdslUtil.FieldDef.like("recvPhone", odOrder.recvPhone), // 수령자연락처
            QdslUtil.FieldDef.like("recvZip", odOrder.recvZip), // 수령자우편번호
            QdslUtil.FieldDef.like("refundAccountNm", odOrder.refundAccountNm), // 환불 예금주명
            QdslUtil.FieldDef.like("refundAccountNo", odOrder.refundAccountNo), // 환불 계좌번호
            QdslUtil.FieldDef.like("refundBankCd", odOrder.refundBankCd) // 환불 은행코드 — BANK_CODE (무통장/가상계좌 환불 시)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("orderId", odOrder.orderId,
                   "memberNm", odOrder.memberNm,
                   "orderDate", odOrder.orderDate),
        new OrderSpecifier<>(Order.DESC, odOrder.regDate),
        new OrderSpecifier<>(Order.ASC, odOrder.orderId));
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
        update.set(odOrder.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odOrder.orderId.eq(entity.getOrderId())).execute();
        return (int) affected;
    }

}
