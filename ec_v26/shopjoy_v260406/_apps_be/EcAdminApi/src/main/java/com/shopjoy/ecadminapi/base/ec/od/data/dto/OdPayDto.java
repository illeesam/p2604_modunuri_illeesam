package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import com.shopjoy.ecadminapi.common.util.Sensitive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class OdPayDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String payId;  // 결제ID 필터
        @Size(max = 21) private String orderId;        // 상위 FK 필터
        private List<String> orderIds;                 // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String payId;  // 결제ID (YYMMDDhhmmss+rand4)
        private String orderId;  // 주문ID (od_order.)
        private String memberId;  // 회원ID (표시용)
        private String payStatusCd;  // 결제상태 — PAY_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불}
        private String payStatusCdBefore;  // 변경 전 결제상태 — PAY_STATUS
        private String payMethodCd;  // 결제수단 — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스, KAKAO:카카오페이, NAVER:네이버페이 외}
        private String payDirCd;  // 입금/환불 방향 — PAY_DIR_CD {DEPOSIT:입금, REFUND:환불}
        private String payChannelCd;  // 결제채널 — PAY_CHANNEL_CD {CARD:카드, ACCOUNT:계좌이체, KAKAO:카카오페이, NAVER:네이버페이, PHONE:휴대폰}
        private Long payAmt;  // 결제 금액
        private Long refundAmt;  // 환불 금액
        private String refundStatusCd;  // 환불 상태 — REFUND_STATUS_CD {PENDING:대기, COMPLT:완료, FAILED:실패}
        private LocalDateTime refundDate;  // 환불 완료일시
        private String pgTransactionId;  // PG 거래ID
        private String pgOrderId;  // PG 주문번호 (PG사 발급 주문 식별자)
        private String pgResultCd;  // PG 응답결과코드
        private String pgResultMsg;  // PG 응답결과메시지
        private LocalDateTime payDate;  // 결제 완료일시
        @Sensitive("account") private String cardNo;  // 카드번호 (마스킹: ****-****-****-5678)
        private String cardTypeCd;  // 카드 타입 — CARD_TYPE_CD {CREDIT:신용카드, DEBIT:체크카드, CHECK:직불카드}
        private Integer cardInstallMonth;  // 할부 개월수 (0=일시불)
        private String vbankBankCd;  // 가상계좌 은행코드 — BANK_CODE {KOOKMIN:국민은행, SHINHAN:신한은행, WOORI:우리은행 외}
        @Sensitive("account") private String vbankAccountNo;  // 가상계좌 계좌번호
        @Sensitive("name")    private String vbankAccountNm;  // 가상계좌 예금주명
        private LocalDateTime vbankExpireDate;  // 가상계좌 입금기한
        private String memo;  // 메모
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String memberNm;  // 회원명 (조인 표시용)
        private LocalDateTime orderDate;  // 주문일시 (od_order 조인)
        private String orderStatusCd;  // 주문상태 (od_order 조인) — ORDER_STATUS_CD
        @Sensitive("email") private String memberEmail;  // 회원 이메일 (mb_member 조인)
        private String payStatusCdNm;  // 결제상태 코드 라벨
        private String payMethodCdNm;  // 결제수단 코드 라벨
        private String payDirCdNm;  // 입금/환불방향 코드 라벨
        private String payChannelCdNm;  // 결제채널 코드 라벨
        private String refundStatusCdNm;  // 환불상태 코드 라벨
        private String vbankBankCdNm;  // 가상계좌은행 코드 라벨
        private String cardTypeCdNm;  // 카드유형 코드 라벨
    }

}
