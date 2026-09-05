package com.shopjoy.ecBeBo.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "od_order", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 주문 엔티티
@Comment("주문")
public class OdOrder extends BaseEntity {

    @Id
    @Comment("주문ID (YYMMDDhhmmss+rand4)")
    @Column(name = "order_id", length = 21, nullable = false)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("회원ID")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("주문자명")
    @Column(name = "member_nm", length = 50)
    @Size(max = 50, message = "memberNm 는 50자 이내여야 합니다.")
    private String memberNm;

    @Comment("주문자 이메일 (주문 시점 스냅샷)")
    @Column(name = "orderer_email", length = 100)
    @Size(max = 100, message = "ordererEmail 는 100자 이내여야 합니다.")
    private String ordererEmail;

    @Comment("주문 시점 회원등급 (코드: MEMBER_GRADE)")
    @Column(name = "order_grade_cd", length = 20)
    @Size(max = 20, message = "orderGradeCd 는 20자 이내여야 합니다.")
    private String orderGradeCd;

    @Comment("주문일시")
    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Comment("주문유입경로 (코드: ACCESS_CHANNEL_CD — WEB_PC/WEB_MOBILE/APP_IOS/APP_ANDROID)")
    @Column(name = "access_channel_cd", length = 20)
    @Size(max = 20, message = "accessChannelCd 는 20자 이내여야 합니다.")
    private String accessChannelCd;

    @Comment("상품합계금액 (현재값)")
    @Column(name = "total_amt")
    private Long totalAmt;

    @Comment("총 할인금액 쿠폰+프로모션 합계 (현재값)")
    @Column(name = "total_discount_amt")
    private Long totalDiscountAmt;

    @Comment("쿠폰할인금액")
    @Column(name = "coupon_discount_amt")
    private Long couponDiscountAmt;

    @Comment("적립금사용금액")
    @Column(name = "cache_use_amt")
    private Long cacheUseAmt;

    @Comment("배송비 적립금 사용금액")
    @Column(name = "shipping_save_use_amt")
    private Long shippingSaveUseAmt;

    @Comment("출고배송료 (현재값)")
    @Column(name = "outbound_shipping_fee")
    private Long outboundShippingFee;

    @Comment("실결제금액 (현재값)")
    @Column(name = "pay_amt")
    private Long payAmt;

    @Comment("원 상품합계금액 (주문 확정 시점 스냅샷)")
    @Column(name = "org_total_amt")
    private Long orgTotalAmt;

    @Comment("원 총 할인금액 (주문 확정 시점 스냅샷)")
    @Column(name = "org_total_discount_amt")
    private Long orgTotalDiscountAmt;

    @Comment("원 배송비 (주문 확정 시점 스냅샷)")
    @Column(name = "org_shipping_fee")
    private Long orgShippingFee;

    @Comment("원 적립금사용금액 (주문 확정 시점 스냅샷)")
    @Column(name = "org_cache_use_amt")
    private Long orgCacheUseAmt;

    @Comment("원 실결제금액 (주문 확정 시점 스냅샷)")
    @Column(name = "org_pay_amt")
    private Long orgPayAmt;

    @Comment("결제수단 (코드: PAY_METHOD)")
    @Column(name = "pay_method_cd", length = 20)
    @Size(max = 20, message = "payMethodCd 는 20자 이내여야 합니다.")
    private String payMethodCd;

    @Comment("결제일시")
    @Column(name = "pay_date")
    private LocalDateTime payDate;

    @Comment("주문상태 (코드: ORDER_STATUS_CD)")
    @Column(name = "order_status_cd", length = 20)
    @Size(max = 20, message = "orderStatusCd 는 20자 이내여야 합니다.")
    private String orderStatusCd;

    @Comment("변경 전 주문상태 (코드: ORDER_STATUS_CD)")
    @Column(name = "order_status_cd_before", length = 20)
    @Size(max = 20, message = "orderStatusCdBefore 는 20자 이내여야 합니다.")
    private String orderStatusCdBefore;

    @Comment("수령자명")
    @Column(name = "recv_nm", length = 50)
    @Size(max = 50, message = "recvNm 는 50자 이내여야 합니다.")
    private String recvNm;

    @Comment("수령자연락처")
    @Column(name = "recv_phone", length = 20)
    @Size(max = 20, message = "recvPhone 는 20자 이내여야 합니다.")
    private String recvPhone;

    @Comment("수령자우편번호")
    @Column(name = "recv_zip", length = 10)
    @Size(max = 10, message = "recvZip 는 10자 이내여야 합니다.")
    private String recvZip;

    @Comment("수령자주소")
    @Column(name = "recv_addr", length = 200)
    @Size(max = 200, message = "recvAddr 는 200자 이내여야 합니다.")
    private String recvAddr;

    @Comment("수령자상세주소")
    @Column(name = "recv_addr_detail", length = 200)
    @Size(max = 200, message = "recvAddrDetail 는 200자 이내여야 합니다.")
    private String recvAddrDetail;

    @Comment("배송메모")
    @Column(name = "recv_memo", length = 200)
    @Size(max = 200, message = "recvMemo 는 200자 이내여야 합니다.")
    private String recvMemo;

    @Comment("공동현관 비밀번호")
    @Column(name = "entrance_pwd", length = 20)
    @Size(max = 20, message = "entrancePwd 는 20자 이내여야 합니다.")
    private String entrancePwd;

    @Comment("환불 은행코드 (코드: BANK_CODE — 무통장/가상계좌 환불 시)")
    @Column(name = "refund_bank_cd", length = 20)
    @Size(max = 20, message = "refundBankCd 는 20자 이내여야 합니다.")
    private String refundBankCd;

    @Comment("환불 계좌번호")
    @Column(name = "refund_account_no", length = 50)
    @Size(max = 50, message = "refundAccountNo 는 50자 이내여야 합니다.")
    private String refundAccountNo;

    @Comment("환불 예금주명")
    @Column(name = "refund_account_nm", length = 50)
    @Size(max = 50, message = "refundAccountNm 는 50자 이내여야 합니다.")
    private String refundAccountNm;

    @Comment("사용쿠폰ID")
    @Column(name = "coupon_id", length = 21)
    @Size(max = 21, message = "couponId 는 21자 이내여야 합니다.")
    private String couponId;

    @Comment("관리메모")
    @Column(name = "memo", columnDefinition = "TEXT")
    @Size(max = 500000, message = "memo 는 500,000자 이내여야 합니다.")
    private String memo;

    @Comment("최근 출고 택배사 (코드: COURIER)")
    @Column(name = "dliv_courier_cd", length = 30)
    @Size(max = 30, message = "dlivCourierCd 는 30자 이내여야 합니다.")
    private String dlivCourierCd;

    @Comment("최근 출고 송장번호")
    @Column(name = "dliv_tracking_no", length = 100)
    @Size(max = 100, message = "dlivTrackingNo 는 100자 이내여야 합니다.")
    private String dlivTrackingNo;

    @Comment("배송상태 최신 (코드: DLIV_STATUS)")
    @Column(name = "dliv_status_cd", length = 20)
    @Size(max = 20, message = "dlivStatusCd 는 20자 이내여야 합니다.")
    private String dlivStatusCd;

    @Comment("변경 전 배송상태 (코드: DLIV_STATUS)")
    @Column(name = "dliv_status_cd_before", length = 20)
    @Size(max = 20, message = "dlivStatusCdBefore 는 20자 이내여야 합니다.")
    private String dlivStatusCdBefore;

    @Comment("최근 출고일시")
    @Column(name = "dliv_ship_date")
    private LocalDateTime dlivShipDate;

    @Comment("결재상태 (코드: APPR_STATUS_CD)")
    @Column(name = "appr_status_cd", length = 20)
    @Size(max = 20, message = "apprStatusCd 는 20자 이내여야 합니다.")
    private String apprStatusCd;

    @Comment("변경 전 결재상태 (코드: APPR_STATUS_CD)")
    @Column(name = "appr_status_cd_before", length = 20)
    @Size(max = 20, message = "apprStatusCdBefore 는 20자 이내여야 합니다.")
    private String apprStatusCdBefore;

    @Comment("결재 요청금액")
    @Column(name = "appr_amt")
    private Long apprAmt;

    @Comment("결재대상 구분 (코드: APPR_TARGET_CD)")
    @Column(name = "appr_target_cd", length = 30)
    @Size(max = 30, message = "apprTargetCd 는 30자 이내여야 합니다.")
    private String apprTargetCd;

    @Comment("결재 대상명")
    @Column(name = "appr_target_nm", length = 200)
    @Size(max = 200, message = "apprTargetNm 는 200자 이내여야 합니다.")
    private String apprTargetNm;

    @Comment("사유/메모")
    @Column(name = "appr_reason", length = 500)
    @Size(max = 500, message = "apprReason 는 500자 이내여야 합니다.")
    private String apprReason;

    @Comment("결재 요청자 (sy_user.user_id)")
    @Column(name = "appr_req_user_id", length = 21)
    @Size(max = 21, message = "apprReqUserId 는 21자 이내여야 합니다.")
    private String apprReqUserId;

    @Comment("결재 요청일시")
    @Column(name = "appr_req_date")
    private LocalDateTime apprReqDate;

    @Comment("결재자 (sy_user.user_id)")
    @Column(name = "appr_aprv_user_id", length = 21)
    @Size(max = 21, message = "apprAprvUserId 는 21자 이내여야 합니다.")
    private String apprAprvUserId;

    @Comment("결재일시")
    @Column(name = "appr_aprv_date")
    private LocalDateTime apprAprvDate;

    @Comment("시뮬데이터여부 (Y/N)")
    @Column(name = "simul_yn", length = 1, columnDefinition = "VARCHAR(1) DEFAULT 'N'")
    @Size(max = 1, message = "simulYn 는 1자 이내여야 합니다.")
    private String simulYn;

}
