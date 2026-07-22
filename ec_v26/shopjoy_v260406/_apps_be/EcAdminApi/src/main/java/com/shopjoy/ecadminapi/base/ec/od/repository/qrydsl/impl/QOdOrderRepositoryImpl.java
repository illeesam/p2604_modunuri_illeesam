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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderRepository;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "order_date", odOrder.orderDate,
        "reg_date", odOrder.regDate,
        "upd_date", odOrder.updDate,
        "pay_date", odOrder.payDate,
        "dliv_ship_date", odOrder.dlivShipDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("accessChannelCd", odOrder.accessChannelCd),
        Map.entry("apprAprvUserId", odOrder.apprAprvUserId),
        Map.entry("apprReason", odOrder.apprReason),
        Map.entry("apprReqUserId", odOrder.apprReqUserId),
        Map.entry("apprStatusCd", odOrder.apprStatusCd),
        Map.entry("apprStatusCdBefore", odOrder.apprStatusCdBefore),
        Map.entry("apprTargetCd", odOrder.apprTargetCd),
        Map.entry("apprTargetNm", odOrder.apprTargetNm),
        Map.entry("couponId", odOrder.couponId),
        Map.entry("dlivCourierCd", odOrder.dlivCourierCd),
        Map.entry("dlivStatusCd", odOrder.dlivStatusCd),
        Map.entry("dlivStatusCdBefore", odOrder.dlivStatusCdBefore),
        Map.entry("dlivTrackingNo", odOrder.dlivTrackingNo),
        Map.entry("entrancePwd", odOrder.entrancePwd),
        Map.entry("memberId", odOrder.memberId),
        Map.entry("memberNm", odOrder.memberNm),
        Map.entry("memo", odOrder.memo),
        Map.entry("orderGradeCd", odOrder.orderGradeCd),
        Map.entry("orderId", odOrder.orderId),
        Map.entry("orderStatusCd", odOrder.orderStatusCd),
        Map.entry("orderStatusCdBefore", odOrder.orderStatusCdBefore),
        Map.entry("ordererEmail", odOrder.ordererEmail),
        Map.entry("payMethodCd", odOrder.payMethodCd),
        Map.entry("recvAddr", odOrder.recvAddr),
        Map.entry("recvAddrDetail", odOrder.recvAddrDetail),
        Map.entry("recvMemo", odOrder.recvMemo),
        Map.entry("recvNm", odOrder.recvNm),
        Map.entry("recvPhone", odOrder.recvPhone),
        Map.entry("recvZip", odOrder.recvZip),
        Map.entry("refundAccountNm", odOrder.refundAccountNm),
        Map.entry("refundAccountNo", odOrder.refundAccountNo),
        Map.entry("refundBankCd", odOrder.refundBankCd),
        Map.entry("siteId", odOrder.siteId)
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * ORDER_STATUS  {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소}
     * PAY_METHOD    {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
     * DLIV_STATUS   {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
     * ACCESS_CHANNEL {WEB_PC:Web-PC, WEB_MOBILE:모바일 웹, APP_IOS:앱-iOS, APP_ANDROID:앱-Android}
     * APPROVAL_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료}
     */
    private JPAQuery<OdOrderDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        odOrder.orderId,               // 주문ID (YYMMDDhhmmss+rand4)
                        odOrder.siteId,                // 사이트ID (sy_site.site_id)
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
                        odOrder.apprStatusCd,          // 결재상태 — APPROVAL_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료}
                        odOrder.apprStatusCdBefore,    // 변경 전 결재상태 — APPROVAL_STATUS (동일 코드그룹)
                        odOrder.apprAmt,               // 결재 요청금액
                        odOrder.apprTargetCd,          // 결재대상 구분 — APPROVAL_TARGET {ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결제}
                        odOrder.apprTargetNm,          // 결재 대상명
                        odOrder.apprReason,            // 사유/메모
                        odOrder.apprReqUserId,         // 결재 요청자 (sy_user.user_id)
                        odOrder.apprReqDate,           // 결재 요청일시
                        odOrder.apprAprvUserId,        // 결재자 (sy_user.user_id)
                        odOrder.apprAprvDate,          // 결재일시
                        odOrder.memo,                  // 관리메모
                        odOrder.orderDate,             // 주문일시
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

    /*
     * selectById — 코드성 필드 예시 코드값 (baseListQuery 와 동일 코드그룹, 상세조회 전용 별도 projection)
     * ORDER_STATUS {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소}
     * BANK_CODE {신한:신한은행, 국민:국민은행, 우리:우리은행, 농협:NH농협 등}
     * APPROVAL_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료} / APPROVAL_TARGET {ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결제}
     */
    /* 주문 키조회 */
    @Override
    public Optional<OdOrderDto.Item> selectById(String orderId) {
        OdOrderDto.Item dto = queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        // a.* equivalent (DTO Item 에 존재하는 필드만)
                        odOrder.orderId,               // 주문ID (YYMMDDhhmmss+rand4)
                        odOrder.siteId,                // 사이트ID (sy_site.site_id)
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
                        odOrder.apprStatusCd,          // 결재상태 — APPROVAL_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료}
                        odOrder.apprStatusCdBefore,    // 변경 전 결재상태 — APPROVAL_STATUS (동일 코드그룹)
                        odOrder.apprAmt,               // 결재 요청금액
                        odOrder.apprTargetCd,          // 결재대상 구분 — APPROVAL_TARGET {ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결제}
                        odOrder.apprTargetNm,          // 결재 대상명
                        odOrder.apprReason,            // 사유/메모
                        odOrder.apprReqUserId,         // 결재 요청자 (sy_user.user_id)
                        odOrder.apprReqDate,           // 결재 요청일시
                        odOrder.apprAprvUserId,        // 결재자 (sy_user.user_id)
                        odOrder.apprAprvDate,          // 결재일시
                        odOrder.memo,                  // 관리메모
                        odOrder.orderDate,             // 주문일시
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
                    QdslUtil.strEq(odOrder.siteId, search.getSiteId()),
                    QdslUtil.strEq(odOrder.orderId, search.getOrderId()),
                    QdslUtil.strEq(odOrder.memberId, search.getMemberId()),
                    QdslUtil.strEq(odOrder.orderStatusCd, search.getOrderStatusCd()),
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

    /* 주문 페이지조회 */
    @Override
    public OdOrderDto.PageResponse selectPageData(OdOrderDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odOrder.siteId, search.getSiteId()),
                QdslUtil.strEq(odOrder.orderId, search.getOrderId()),
                QdslUtil.strEq(odOrder.memberId, search.getMemberId()),
                QdslUtil.strEq(odOrder.orderStatusCd, search.getOrderStatusCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
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
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(OdOrderDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
