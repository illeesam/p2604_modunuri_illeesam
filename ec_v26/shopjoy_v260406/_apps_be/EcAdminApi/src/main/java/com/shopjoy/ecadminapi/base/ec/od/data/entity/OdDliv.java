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
    private String dlivId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("주문ID (od_order.)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("클레임ID (od_claim., 클레임 배송일 때만)")
    @Column(name = "claim_id", length = 21)
    private String claimId;

    @Comment("출고 업체ID (벤더별 분리출고 시)")
    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Comment("회원ID")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("주문자명")
    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Comment("수령자명")
    @Column(name = "recv_nm", length = 50)
    private String recvNm;

    @Comment("수령자연락처")
    @Column(name = "recv_phone", length = 20)
    private String recvPhone;

    @Comment("우편번호")
    @Column(name = "recv_zip", length = 10)
    private String recvZip;

    @Comment("주소")
    @Column(name = "recv_addr", length = 200)
    private String recvAddr;

    @Comment("상세주소")
    @Column(name = "recv_addr_detail", length = 200)
    private String recvAddrDetail;

    @Comment("입출고구분 (코드: DLIV_DIV — OUTBOUND/INBOUND)")
    @Column(name = "dliv_div_cd", length = 20)
    private String dlivDivCd;

    @Comment("배송유형 (코드: DLIV_TYPE — NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT)")
    @Column(name = "dliv_type_cd", length = 20)
    private String dlivTypeCd;

    @Comment("배송비결제방식 (코드: DLIV_PAY_TYPE — PREPAY/COD)")
    @Column(name = "dliv_pay_type_cd", length = 20)
    private String dlivPayTypeCd;

    @Comment("출고(발송) 택배사 (코드: COURIER)")
    @Column(name = "outbound_courier_cd", length = 30)
    private String outboundCourierCd;

    @Comment("출고(발송) 송장번호")
    @Column(name = "outbound_tracking_no", length = 100)
    private String outboundTrackingNo;

    @Comment("반입 택배사 (반품일 때만, 코드: COURIER)")
    @Column(name = "inbound_courier_cd", length = 30)
    private String inboundCourierCd;

    @Comment("반입 송장번호")
    @Column(name = "inbound_tracking_no", length = 100)
    private String inboundTrackingNo;

    @Comment("배송상태 (코드: DLIV_STATUS)")
    @Column(name = "dliv_status_cd", length = 20)
    private String dlivStatusCd;

    @Comment("변경 전 배송상태 (코드: DLIV_STATUS)")
    @Column(name = "dliv_status_cd_before", length = 20)
    private String dlivStatusCdBefore;

    @Comment("출고일시")
    @Column(name = "dliv_ship_date")
    private LocalDateTime dlivShipDate;

    @Comment("배송완료일시")
    @Column(name = "dliv_date")
    private LocalDateTime dlivDate;

    @Comment("메모")
    @Column(name = "dliv_memo", length = 300)
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

    @Comment("배송료 구분 (코드: SHIPPING_FEE_TYPE — OUTBOUND/RETURN/INBOUND/EXCHANGE)")
    @Column(name = "shipping_fee_type_cd", length = 20)
    private String shippingFeeTypeCd;

    @Comment("부모 배송ID (교환 시 원본 배송 참조)")
    @Column(name = "parent_dliv_id", length = 21)
    private String parentDlivId;

    @Comment("결재상태 (코드: APPROVAL_STATUS)")
    @Column(name = "appr_status_cd", length = 20)
    private String apprStatusCd;

    @Comment("변경 전 결재상태 (코드: APPROVAL_STATUS)")
    @Column(name = "appr_status_cd_before", length = 20)
    private String apprStatusCdBefore;

    @Comment("결재 요청금액")
    @Column(name = "appr_amt")
    private Long apprAmt;

    @Comment("결재대상 구분 (코드: APPROVAL_TARGET)")
    @Column(name = "appr_target_cd", length = 30)
    private String apprTargetCd;

    @Comment("결재 대상명")
    @Column(name = "appr_target_nm", length = 200)
    private String apprTargetNm;

    @Comment("사유/메모")
    @Column(name = "appr_reason", length = 500)
    private String apprReason;

    @Comment("결재 요청자 (sy_user.user_id)")
    @Column(name = "appr_req_user_id", length = 21)
    private String apprReqUserId;

    @Comment("결재 요청일시")
    @Column(name = "appr_req_date")
    private LocalDateTime apprReqDate;

    @Comment("결재자 (sy_user.user_id)")
    @Column(name = "appr_aprv_user_id", length = 21)
    private String apprAprvUserId;

    @Comment("결재일시")
    @Column(name = "appr_aprv_date")
    private LocalDateTime apprAprvDate;

}
