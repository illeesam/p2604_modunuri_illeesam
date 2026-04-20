package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "od_claim", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 클레임(취소/반품/교환) 엔티티
public class OdClaim {

    @Id
    @Column(name = "claim_id", length = 21, nullable = false)
    private String claimId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Column(name = "claim_type_cd", length = 20, nullable = false)
    private String claimTypeCd;

    @Column(name = "claim_status_cd", length = 20)
    private String claimStatusCd;

    @Column(name = "claim_status_cd_before", length = 20)
    private String claimStatusCdBefore;

    @Column(name = "reason_cd", length = 50)
    private String reasonCd;

    @Lob
    @Column(name = "reason_detail", columnDefinition = "TEXT")
    private String reasonDetail;

    @Column(name = "prod_nm", length = 200)
    private String prodNm;

    @Column(name = "customer_fault_yn", length = 1)
    private String customerFaultYn;

    @Column(name = "claim_cancel_yn", length = 1)
    private String claimCancelYn;

    @Column(name = "claim_cancel_date")
    private LocalDateTime claimCancelDate;

    @Column(name = "claim_cancel_reason_cd", length = 50)
    private String claimCancelReasonCd;

    @Column(name = "claim_cancel_reason_detail", length = 300)
    private String claimCancelReasonDetail;

    @Column(name = "refund_method_cd", length = 20)
    private String refundMethodCd;

    @Column(name = "refund_amt")
    private Long refundAmt;

    @Column(name = "refund_prod_amt")
    private Long refundProdAmt;

    @Column(name = "refund_shipping_amt")
    private Long refundShippingAmt;

    @Column(name = "refund_save_amt")
    private Long refundSaveAmt;

    @Column(name = "refund_bank_cd", length = 20)
    private String refundBankCd;

    @Column(name = "refund_account_no", length = 50)
    private String refundAccountNo;

    @Column(name = "refund_account_nm", length = 50)
    private String refundAccountNm;

    @Column(name = "request_date")
    private LocalDateTime requestDate;

    @Column(name = "proc_date")
    private LocalDateTime procDate;

    @Column(name = "proc_user_id", length = 21)
    private String procUserId;

    @Lob
    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;

    @Column(name = "add_shipping_fee")
    private Long addShippingFee;

    @Column(name = "add_shipping_fee_charge_cd", length = 20)
    private String addShippingFeeChargeCd;

    @Column(name = "add_shipping_fee_reason", length = 300)
    private String addShippingFeeReason;

    @Column(name = "collect_nm", length = 50)
    private String collectNm;

    @Column(name = "collect_phone", length = 20)
    private String collectPhone;

    @Column(name = "collect_zip", length = 10)
    private String collectZip;

    @Column(name = "collect_addr", length = 200)
    private String collectAddr;

    @Column(name = "collect_addr_detail", length = 200)
    private String collectAddrDetail;

    @Column(name = "collect_req_memo", length = 200)
    private String collectReqMemo;

    @Column(name = "collect_schd_date")
    private LocalDateTime collectSchdDate;

    @Column(name = "return_shipping_fee")
    private Long returnShippingFee;

    @Column(name = "return_courier_cd", length = 30)
    private String returnCourierCd;

    @Column(name = "return_tracking_no", length = 100)
    private String returnTrackingNo;

    @Column(name = "return_status_cd", length = 20)
    private String returnStatusCd;

    @Column(name = "return_status_cd_before", length = 20)
    private String returnStatusCdBefore;

    @Column(name = "inbound_shipping_fee")
    private Long inboundShippingFee;

    @Column(name = "inbound_courier_cd", length = 30)
    private String inboundCourierCd;

    @Column(name = "inbound_tracking_no", length = 100)
    private String inboundTrackingNo;

    @Column(name = "inbound_dliv_id", length = 21)
    private String inboundDlivId;

    @Column(name = "exch_recv_nm", length = 50)
    private String exchRecvNm;

    @Column(name = "exch_recv_phone", length = 20)
    private String exchRecvPhone;

    @Column(name = "exch_recv_zip", length = 10)
    private String exchRecvZip;

    @Column(name = "exch_recv_addr", length = 200)
    private String exchRecvAddr;

    @Column(name = "exch_recv_addr_detail", length = 200)
    private String exchRecvAddrDetail;

    @Column(name = "exch_recv_req_memo", length = 200)
    private String exchRecvReqMemo;

    @Column(name = "exchange_shipping_fee")
    private Long exchangeShippingFee;

    @Column(name = "exchange_courier_cd", length = 30)
    private String exchangeCourierCd;

    @Column(name = "exchange_tracking_no", length = 100)
    private String exchangeTrackingNo;

    @Column(name = "outbound_dliv_id", length = 21)
    private String outboundDlivId;

    @Column(name = "total_shipping_fee")
    private Long totalShippingFee;

    @Column(name = "shipping_fee_paid_yn", length = 1)
    private String shippingFeePaidYn;

    @Column(name = "shipping_fee_paid_date")
    private LocalDateTime shippingFeePaidDate;

    @Column(name = "shipping_fee_memo", length = 300)
    private String shippingFeeMemo;

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