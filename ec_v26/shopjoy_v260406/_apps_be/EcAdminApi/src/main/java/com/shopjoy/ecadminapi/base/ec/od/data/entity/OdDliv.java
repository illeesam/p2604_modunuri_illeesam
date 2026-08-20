package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "od_dliv", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배송 엔티티
@Comment("배송 (1주문 N배송 가능 — 정상출고/반품반입/교환배송)")
public class OdDliv extends BaseEntity {

    @Id
    @Comment("배송ID (YYMMDDhhmmss+rand4)")
    @Column(name = "dliv_id", length = 21, nullable = false)
    @Size(max = 21, message = "dlivId 는 21자 이내여야 합니다.")
    private String dlivId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("주문ID (od_order.)")
    @Column(name = "order_id", length = 21, nullable = false)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("클레임ID (od_claim., 클레임 배송일 때만)")
    @Column(name = "claim_id", length = 21)
    @Size(max = 21, message = "claimId 는 21자 이내여야 합니다.")
    private String claimId;

    @Comment("출고 업체ID (벤더별 분리출고 시)")
    @Column(name = "vendor_id", length = 21)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("회원ID")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("주문자명")
    @Column(name = "member_nm", length = 50)
    @Size(max = 50, message = "memberNm 는 50자 이내여야 합니다.")
    private String memberNm;

    @Comment("수령자명")
    @Column(name = "recv_nm", length = 50)
    @Size(max = 50, message = "recvNm 는 50자 이내여야 합니다.")
    private String recvNm;

    @Comment("수령자연락처")
    @Column(name = "recv_phone", length = 20)
    @Size(max = 20, message = "recvPhone 는 20자 이내여야 합니다.")
    private String recvPhone;

    @Comment("우편번호")
    @Column(name = "recv_zip", length = 10)
    @Size(max = 10, message = "recvZip 는 10자 이내여야 합니다.")
    private String recvZip;

    @Comment("주소")
    @Column(name = "recv_addr", length = 200)
    @Size(max = 100, message = "recvAddr 는 100자 이내여야 합니다.")
    private String recvAddr;

    @Comment("상세주소")
    @Column(name = "recv_addr_detail", length = 200)
    @Size(max = 100, message = "recvAddrDetail 는 100자 이내여야 합니다.")
    private String recvAddrDetail;

    @Comment("입출고구분 (코드: DLIV_DIV_CD — OUTBOUND/INBOUND)")
    @Column(name = "dliv_div_cd", length = 20)
    @Size(max = 20, message = "dlivDivCd 는 20자 이내여야 합니다.")
    private String dlivDivCd;

    @Comment("배송유형 (코드: DLIV_TYPE_CD — NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT)")
    @Column(name = "dliv_type_cd", length = 20)
    @Size(max = 20, message = "dlivTypeCd 는 20자 이내여야 합니다.")
    private String dlivTypeCd;

    @Comment("배송비결제방식 (코드: DLIV_PAY_TYPE_CD — PREPAY/COD)")
    @Column(name = "dliv_pay_type_cd", length = 20)
    @Size(max = 20, message = "dlivPayTypeCd 는 20자 이내여야 합니다.")
    private String dlivPayTypeCd;

    @Comment("출고(발송) 택배사 (코드: COURIER)")
    @Column(name = "outbound_courier_cd", length = 30)
    @Size(max = 30, message = "outboundCourierCd 는 30자 이내여야 합니다.")
    private String outboundCourierCd;

    @Comment("출고(발송) 송장번호")
    @Column(name = "outbound_tracking_no", length = 100)
    @Size(max = 100, message = "outboundTrackingNo 는 100자 이내여야 합니다.")
    private String outboundTrackingNo;

    @Comment("반입 택배사 (반품일 때만, 코드: COURIER)")
    @Column(name = "inbound_courier_cd", length = 30)
    @Size(max = 30, message = "inboundCourierCd 는 30자 이내여야 합니다.")
    private String inboundCourierCd;

    @Comment("반입 송장번호")
    @Column(name = "inbound_tracking_no", length = 100)
    @Size(max = 100, message = "inboundTrackingNo 는 100자 이내여야 합니다.")
    private String inboundTrackingNo;

    @Comment("배송상태 (코드: DLIV_STATUS)")
    @Column(name = "dliv_status_cd", length = 20)
    @Size(max = 20, message = "dlivStatusCd 는 20자 이내여야 합니다.")
    private String dlivStatusCd;

    @Comment("변경 전 배송상태 (코드: DLIV_STATUS)")
    @Column(name = "dliv_status_cd_before", length = 20)
    @Size(max = 20, message = "dlivStatusCdBefore 는 20자 이내여야 합니다.")
    private String dlivStatusCdBefore;

    @Comment("출고일시")
    @Column(name = "dliv_ship_date")
    private LocalDateTime dlivShipDate;

    @Comment("배송완료일시")
    @Column(name = "dliv_date")
    private LocalDateTime dlivDate;

    @Comment("메모 (HTML 에디터)")
    @Column(name = "dliv_memo", columnDefinition = "TEXT")
    @Size(max = 500000, message = "dlivMemo 는 500,000자 이내여야 합니다.")
    private String dlivMemo;

    @Comment("배송료 (현재값)")
    @Column(name = "shipping_fee")
    private Long shippingFee;

    @Comment("원 배송비 (할인 전 스냅샷)")
    @Column(name = "org_shipping_fee")
    private Long orgShippingFee;

    @Comment("배송비 쿠폰할인금액")
    @Column(name = "shipping_discount_amt")
    private Long shippingDiscountAmt;

    @Comment("배송료 구분 (코드: SHIPPING_FEE_TYPE_CD — OUTBOUND/RETURN/INBOUND/EXCHANGE)")
    @Column(name = "shipping_fee_type_cd", length = 20)
    @Size(max = 20, message = "shippingFeeTypeCd 는 20자 이내여야 합니다.")
    private String shippingFeeTypeCd;

    @Comment("부모 배송ID (교환 시 원본 배송 참조)")
    @Column(name = "parent_dliv_id", length = 21)
    @Size(max = 21, message = "parentDlivId 는 21자 이내여야 합니다.")
    private String parentDlivId;

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
    @Size(max = 100, message = "apprTargetNm 는 100자 이내여야 합니다.")
    private String apprTargetNm;

    @Comment("사유/메모")
    @Column(name = "appr_reason", length = 500)
    @Size(max = 100, message = "apprReason 는 100자 이내여야 합니다.")
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

}
