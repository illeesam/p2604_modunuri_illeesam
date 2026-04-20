package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "od_order", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 주문 엔티티
public class OdOrder {

    @Id
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Column(name = "orderer_email", length = 100)
    private String ordererEmail;

    @Column(name = "order_grade_cd", length = 20)
    private String orderGradeCd;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "access_channel_cd", length = 20)
    private String accessChannelCd;

    @Column(name = "total_amt")
    private Long totalAmt;

    @Column(name = "total_discount_amt")
    private Long totalDiscountAmt;

    @Column(name = "coupon_discount_amt")
    private Long couponDiscountAmt;

    @Column(name = "cache_use_amt")
    private Long cacheUseAmt;

    @Column(name = "shipping_save_use_amt")
    private Long shippingSaveUseAmt;

    @Column(name = "outbound_shipping_fee")
    private Long outboundShippingFee;

    @Column(name = "pay_amt")
    private Long payAmt;

    @Column(name = "org_total_amt")
    private Long orgTotalAmt;

    @Column(name = "org_total_discount_amt")
    private Long orgTotalDiscountAmt;

    @Column(name = "org_shipping_fee")
    private Long orgShippingFee;

    @Column(name = "org_cache_use_amt")
    private Long orgCacheUseAmt;

    @Column(name = "org_pay_amt")
    private Long orgPayAmt;

    @Column(name = "pay_method_cd", length = 20)
    private String payMethodCd;

    @Column(name = "pay_date")
    private LocalDateTime payDate;

    @Column(name = "order_status_cd", length = 20)
    private String orderStatusCd;

    @Column(name = "order_status_cd_before", length = 20)
    private String orderStatusCdBefore;

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

    @Column(name = "recv_memo", length = 200)
    private String recvMemo;

    @Column(name = "entrance_pwd", length = 20)
    private String entrancePwd;

    @Column(name = "refund_bank_cd", length = 20)
    private String refundBankCd;

    @Column(name = "refund_account_no", length = 50)
    private String refundAccountNo;

    @Column(name = "refund_account_nm", length = 50)
    private String refundAccountNm;

    @Column(name = "coupon_id", length = 21)
    private String couponId;

    @Lob
    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;

    @Column(name = "dliv_courier_cd", length = 30)
    private String dlivCourierCd;

    @Column(name = "dliv_tracking_no", length = 100)
    private String dlivTrackingNo;

    @Column(name = "dliv_status_cd", length = 20)
    private String dlivStatusCd;

    @Column(name = "dliv_status_cd_before", length = 20)
    private String dlivStatusCdBefore;

    @Column(name = "dliv_ship_date")
    private LocalDateTime dlivShipDate;

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