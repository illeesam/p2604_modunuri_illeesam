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
@Table(name = "od_claim", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 클레임(취소/반품/교환) 엔티티
@Comment("클레임 (취소/반품/교환)")
public class OdClaim extends BaseEntity {

    @Id
    @Comment("클레임ID (YYMMDDhhmmss+rand4)")
    @Column(name = "claim_id", length = 21, nullable = false)
    private String claimId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("주문ID")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("회원ID")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("회원명")
    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Comment("클레임유형 (코드: CLAIM_TYPE)")
    @Column(name = "claim_type_cd", length = 20, nullable = false)
    private String claimTypeCd;

    @Comment("클레임상태 (코드: CLAIM_STATUS)")
    @Column(name = "claim_status_cd", length = 20)
    private String claimStatusCd;

    @Comment("변경 전 클레임상태 (코드: CLAIM_STATUS)")
    @Column(name = "claim_status_cd_before", length = 20)
    private String claimStatusCdBefore;

    @Comment("사유코드 (코드: CANCEL_REASON/RETURN_REASON/EXCHANGE_REASON)")
    @Column(name = "reason_cd", length = 50)
    private String reasonCd;

    @Comment("사유 상세")
    @Column(name = "reason_detail", columnDefinition = "TEXT")
    private String reasonDetail;

    @Comment("대표 상품명")
    @Column(name = "prod_nm", length = 200)
    private String prodNm;

    @Comment("고객귀책여부 (Y=고객귀책, N=판매자귀책)")
    @Column(name = "customer_fault_yn", length = 1)
    private String customerFaultYn;

    @Comment("클레임 철회여부 Y/N (신청 자체를 취소한 경우)")
    @Column(name = "claim_cancel_yn", length = 1)
    private String claimCancelYn;

    @Comment("클레임 철회일시")
    @Column(name = "claim_cancel_date")
    private LocalDateTime claimCancelDate;

    @Comment("클레임 철회사유코드")
    @Column(name = "claim_cancel_reason_cd", length = 50)
    private String claimCancelReasonCd;

    @Comment("클레임 철회사유상세")
    @Column(name = "claim_cancel_reason_detail", length = 300)
    private String claimCancelReasonDetail;

    @Comment("환불수단 (코드: REFUND_METHOD)")
    @Column(name = "refund_method_cd", length = 20)
    private String refundMethodCd;

    @Comment("환불 합계금액 (상품금액+배송비-추가배송비-적립금복원)")
    @Column(name = "refund_amt")
    private Long refundAmt;

    @Comment("환불 상품금액")
    @Column(name = "refund_prod_amt")
    private Long refundProdAmt;

    @Comment("환불 배송비")
    @Column(name = "refund_shipping_amt")
    private Long refundShippingAmt;

    @Comment("환불 적립금 합계 (사용 적립금 복원액)")
    @Column(name = "refund_save_amt")
    private Long refundSaveAmt;

    @Comment("환불 은행코드 (코드: BANK_CODE — 계좌이체 환불 시)")
    @Column(name = "refund_bank_cd", length = 20)
    private String refundBankCd;

    @Comment("환불 계좌번호")
    @Column(name = "refund_account_no", length = 50)
    private String refundAccountNo;

    @Comment("환불 예금주명")
    @Column(name = "refund_account_nm", length = 50)
    private String refundAccountNm;

    @Comment("클레임 요청일시")
    @Column(name = "request_date")
    private LocalDateTime requestDate;

    @Comment("처리일시")
    @Column(name = "proc_date")
    private LocalDateTime procDate;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "proc_user_id", length = 21)
    private String procUserId;

    @Comment("관리메모")
    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;

    @Comment("추가배송비 (교환=출고배송비, 반품/취소=무료배송 조건 파괴 시 추가)")
    @Column(name = "add_shipping_fee")
    private Long addShippingFee;

    @Comment("추가배송비 청구방법코드")
    @Column(name = "add_shipping_fee_charge_cd", length = 20)
    private String addShippingFeeChargeCd;

    @Comment("추가배송비 면제사유")
    @Column(name = "add_shipping_fee_reason", length = 300)
    private String addShippingFeeReason;

    @Comment("수거지 성명 (반품·교환 수거 주소)")
    @Column(name = "collect_nm", length = 50)
    private String collectNm;

    @Comment("수거지 연락처")
    @Column(name = "collect_phone", length = 20)
    private String collectPhone;

    @Comment("수거지 우편번호")
    @Column(name = "collect_zip", length = 10)
    private String collectZip;

    @Comment("수거지 기본주소")
    @Column(name = "collect_addr", length = 200)
    private String collectAddr;

    @Comment("수거지 상세주소")
    @Column(name = "collect_addr_detail", length = 200)
    private String collectAddrDetail;

    @Comment("수거 요청사항")
    @Column(name = "collect_req_memo", length = 200)
    private String collectReqMemo;

    @Comment("수거 예정일시")
    @Column(name = "collect_schd_date")
    private LocalDateTime collectSchdDate;

    @Comment("수거배송료")
    @Column(name = "return_shipping_fee")
    private Long returnShippingFee;

    @Comment("수거 택배사 (코드: COURIER)")
    @Column(name = "return_courier_cd", length = 30)
    private String returnCourierCd;

    @Comment("수거 송장번호")
    @Column(name = "return_tracking_no", length = 100)
    private String returnTrackingNo;

    @Comment("수거 상태 (코드: DLIV_STATUS)")
    @Column(name = "return_status_cd", length = 20)
    private String returnStatusCd;

    @Comment("변경 전 수거상태 (코드: DLIV_STATUS)")
    @Column(name = "return_status_cd_before", length = 20)
    private String returnStatusCdBefore;

    @Comment("반입배송료")
    @Column(name = "inbound_shipping_fee")
    private Long inboundShippingFee;

    @Comment("반입 택배사 (코드: COURIER)")
    @Column(name = "inbound_courier_cd", length = 30)
    private String inboundCourierCd;

    @Comment("반입 송장번호")
    @Column(name = "inbound_tracking_no", length = 100)
    private String inboundTrackingNo;

    @Comment("반입 배송ID (od_dliv.)")
    @Column(name = "inbound_dliv_id", length = 21)
    private String inboundDlivId;

    @Comment("교환 수령자명 (원 주문 배송지와 다를 경우)")
    @Column(name = "exch_recv_nm", length = 50)
    private String exchRecvNm;

    @Comment("교환 수령자 연락처")
    @Column(name = "exch_recv_phone", length = 20)
    private String exchRecvPhone;

    @Comment("교환 수령지 우편번호")
    @Column(name = "exch_recv_zip", length = 10)
    private String exchRecvZip;

    @Comment("교환 수령지 기본주소")
    @Column(name = "exch_recv_addr", length = 200)
    private String exchRecvAddr;

    @Comment("교환 수령지 상세주소")
    @Column(name = "exch_recv_addr_detail", length = 200)
    private String exchRecvAddrDetail;

    @Comment("교환 배송 요청사항")
    @Column(name = "exch_recv_req_memo", length = 200)
    private String exchRecvReqMemo;

    @Comment("교환상품 발송배송료")
    @Column(name = "exchange_shipping_fee")
    private Long exchangeShippingFee;

    @Comment("교환상품 발송 택배사 (코드: COURIER)")
    @Column(name = "exchange_courier_cd", length = 30)
    private String exchangeCourierCd;

    @Comment("교환상품 발송 송장번호")
    @Column(name = "exchange_tracking_no", length = 100)
    private String exchangeTrackingNo;

    @Comment("교환상품 발송 배송ID (od_dliv.)")
    @Column(name = "outbound_dliv_id", length = 21)
    private String outboundDlivId;

    @Comment("총 배송료 (수거+반입+발송)")
    @Column(name = "total_shipping_fee")
    private Long totalShippingFee;

    @Comment("배송료 정산 완료 여부 Y/N")
    @Column(name = "shipping_fee_paid_yn", length = 1)
    private String shippingFeePaidYn;

    @Comment("배송료 정산일시")
    @Column(name = "shipping_fee_paid_date")
    private LocalDateTime shippingFeePaidDate;

    @Comment("배송료 비고")
    @Column(name = "shipping_fee_memo", length = 300)
    private String shippingFeeMemo;

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
