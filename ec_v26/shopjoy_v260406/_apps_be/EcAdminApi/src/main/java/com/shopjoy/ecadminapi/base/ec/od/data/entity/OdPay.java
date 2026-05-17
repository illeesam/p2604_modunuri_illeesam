package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "od_pay", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 결제 엔티티
@Comment("결제 (주문당 N건 결제 가능 — 분할결제)")
public class OdPay extends BaseEntity {

    @Id
    @Comment("결제ID (YYMMDDhhmmss+rand4)")
    @Column(name = "pay_id", length = 21, nullable = false)
    private String payId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("주문ID (od_order.)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("클레임ID (od_claim. — 클레임 추가결제 시)")
    @Column(name = "claim_id", length = 21)
    private String claimId;

    @Comment("주문/클레임 구분 (코드: PAY_DIV — ORDER/CLAIM)")
    @Column(name = "pay_div_cd", length = 20)
    private String payDivCd;

    @Comment("입금/환불 방향 (코드: PAY_DIR — DEPOSIT/REFUND)")
    @Column(name = "pay_dir_cd", length = 20)
    private String payDirCd;

    @Comment("결제발생유형 (코드: PAY_OCCUR_TYPE — ORDER/CLAIM_EXTRA/EXCHANGE_EXTRA)")
    @Column(name = "pay_occur_type_cd", length = 20)
    private String payOccurTypeCd;

    @Comment("결제수단 (코드: PAY_METHOD)")
    @Column(name = "pay_method_cd", length = 20, nullable = false)
    private String payMethodCd;

    @Comment("결제채널 (코드: PAY_CHANNEL — TOSS만: CARD/ACCOUNT/KAKAO/NAVER)")
    @Column(name = "pay_channel_cd", length = 20)
    private String payChannelCd;

    @Comment("결제 금액")
    @Column(name = "pay_amt", nullable = false)
    private Long payAmt;

    @Comment("결제상태 (코드: PAY_STATUS)")
    @Column(name = "pay_status_cd", length = 20)
    private String payStatusCd;

    @Comment("변경 전 결제상태 (코드: PAY_STATUS)")
    @Column(name = "pay_status_cd_before", length = 20)
    private String payStatusCdBefore;

    @Comment("결제 완료일시")
    @Column(name = "pay_date")
    private LocalDateTime payDate;

    @Comment("PG사 (TOSS/KAKAO/NAVER 등)")
    @Column(name = "pg_company_cd", length = 20)
    private String pgCompanyCd;

    @Comment("PG 거래ID")
    @Column(name = "pg_transaction_id", length = 100)
    private String pgTransactionId;

    @Comment("PG 승인번호")
    @Column(name = "pg_approval_no", length = 50)
    private String pgApprovalNo;

    @Comment("PG 응답 데이터 (JSON)")
    @Column(name = "pg_response", columnDefinition = "TEXT")
    private String pgResponse;

    @Comment("가상계좌 계좌번호")
    @Column(name = "vbank_account", length = 20)
    private String vbankAccount;

    @Comment("가상계좌 은행코드 (코드: BANK_CODE)")
    @Column(name = "vbank_bank_code", length = 10)
    private String vbankBankCode;

    @Comment("가상계좌 은행명")
    @Column(name = "vbank_bank_nm", length = 50)
    private String vbankBankNm;

    @Comment("가상계좌 예금주명")
    @Column(name = "vbank_holder_nm", length = 50)
    private String vbankHolderNm;

    @Comment("가상계좌 입금기한")
    @Column(name = "vbank_due_date")
    private LocalDate vbankDueDate;

    @Comment("가상계좌 입금자명")
    @Column(name = "vbank_deposit_nm", length = 50)
    private String vbankDepositNm;

    @Comment("가상계좌 입금확인일시")
    @Column(name = "vbank_deposit_date")
    private LocalDateTime vbankDepositDate;

    @Comment("카드번호 (마스킹: ****-****-****-5678)")
    @Column(name = "card_no", length = 20)
    private String cardNo;

    @Comment("카드사 코드")
    @Column(name = "card_issuer_cd", length = 20)
    private String cardIssuerCd;

    @Comment("카드사명")
    @Column(name = "card_issuer_nm", length = 50)
    private String cardIssuerNm;

    @Comment("카드 타입 (코드: CARD_TYPE — CREDIT/DEBIT/CHECK)")
    @Column(name = "card_type_cd", length = 20)
    private String cardTypeCd;

    @Comment("할부 개월수 (0=일시불)")
    @Column(name = "installment_month")
    private Integer installmentMonth;

    @Comment("환불 금액")
    @Column(name = "refund_amt")
    private Long refundAmt;

    @Comment("환불 상태 (코드: REFUND_STATUS)")
    @Column(name = "refund_status_cd", length = 20)
    private String refundStatusCd;

    @Comment("변경 전 환불상태 (코드: REFUND_STATUS)")
    @Column(name = "refund_status_cd_before", length = 20)
    private String refundStatusCdBefore;

    @Comment("환불 완료일시")
    @Column(name = "refund_date")
    private LocalDateTime refundDate;

    @Comment("환불 사유")
    @Column(name = "refund_reason", length = 300)
    private String refundReason;

    @Comment("결제 실패 사유")
    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Comment("결제 실패 코드 (PG 오류코드)")
    @Column(name = "failure_code", length = 50)
    private String failureCode;

    @Comment("결제 실패일시")
    @Column(name = "failure_date")
    private LocalDateTime failureDate;

    @Comment("메모")
    @Column(name = "memo", length = 300)
    private String memo;

}
