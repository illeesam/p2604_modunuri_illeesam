package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "od_dliv", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 배송 엔티티
public class OdDliv {

    @Id
    @Column(name = "dliv_id", length = 21, nullable = false)
    private String dlivId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "claim_id", length = 21)
    private String claimId;

    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Column(name = "recv_nm", length = 50)
    private String recvNm;

    @Column(name = "recv_phone", length = 20)
    private String recvPhone;

    @Column(name = "recv_zip", length = 10)
    private String recvZip;

    @Column(name = "recv_addr", length = 200)
    private String recvAddr;

    @Column(name = "recv_addr_detail", length = 200)
    private String recvAddrDetail;

    @Column(name = "dliv_div_cd", length = 20)
    private String dlivDivCd;

    @Column(name = "dliv_type_cd", length = 20)
    private String dlivTypeCd;

    @Column(name = "dliv_pay_type_cd", length = 20)
    private String dlivPayTypeCd;

    @Column(name = "outbound_courier_cd", length = 30)
    private String outboundCourierCd;

    @Column(name = "outbound_tracking_no", length = 100)
    private String outboundTrackingNo;

    @Column(name = "inbound_courier_cd", length = 30)
    private String inboundCourierCd;

    @Column(name = "inbound_tracking_no", length = 100)
    private String inboundTrackingNo;

    @Column(name = "dliv_status_cd", length = 20)
    private String dlivStatusCd;

    @Column(name = "dliv_status_cd_before", length = 20)
    private String dlivStatusCdBefore;

    @Column(name = "dliv_ship_date")
    private LocalDateTime dlivShipDate;

    @Column(name = "dliv_date")
    private LocalDateTime dlivDate;

    @Column(name = "dliv_memo", length = 300)
    private String dlivMemo;

    @Column(name = "shipping_fee")
    private Long shippingFee;

    @Column(name = "org_shipping_fee")
    private Long orgShippingFee;

    @Column(name = "shipping_discount_amt")
    private Long shippingDiscountAmt;

    @Column(name = "shipping_fee_type_cd", length = 20)
    private String shippingFeeTypeCd;

    @Column(name = "parent_dliv_id", length = 21)
    private String parentDlivId;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    @Column(name = "appr_status_cd", length = 20)
    private String apprStatusCd;

    @Column(name = "appr_status_cd_before", length = 20)
    private String apprStatusCdBefore;

    @Column(name = "appr_amt")
    private Long apprAmt;

    @Column(name = "appr_target_cd", length = 30)
    private String apprTargetCd;

    @Column(name = "appr_target_nm", length = 200)
    private String apprTargetNm;

    @Column(name = "appr_reason", length = 500)
    private String apprReason;

    @Column(name = "appr_req_user_id", length = 21)
    private String apprReqUserId;

    @Column(name = "appr_req_date")
    private LocalDateTime apprReqDate;

    @Column(name = "appr_aprv_user_id", length = 21)
    private String apprAprvUserId;

    @Column(name = "appr_aprv_date")
    private LocalDateTime apprAprvDate;

}