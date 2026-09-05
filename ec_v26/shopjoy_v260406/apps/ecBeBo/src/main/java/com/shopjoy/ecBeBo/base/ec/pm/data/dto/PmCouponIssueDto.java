package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PmCouponIssueDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;         // 사이트ID
        @Size(max = 1) private String useYn;           // 사용여부 필터 Y/N
        @Size(max = 21) private String couponIssueId;  // 발급ID 필터
        @Size(max = 21) private String memberId;       // 회원ID 필터
        private List<String> couponIds;          // 쿠폰 ID IN — prodId 기반 사전 필터용
        @Size(max = 21) private String prodId;   // 상품 기준 필터 — pm_coupon_prod 조회 후 couponIds 주입
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String couponIssueId;      // 발급ID
        private String couponId;           // 쿠폰ID
        private String memberId;           // 회원ID
        private LocalDateTime issueDate;   // 발급일시
        private String useYn;              // 사용여부 Y/N
        private LocalDateTime useDate;     // 사용일시
        private String orderId;            // 사용주문ID
        private String regBy;              // 등록자
        private LocalDateTime regDate;     // 등록일
        private String regSiteId;          // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;              // 수정자
        private LocalDateTime updDate;     // 수정일
        private String couponNm;           // 쿠폰명 (연관 쿠폰 조회)
        private String couponCd;           // 쿠폰코드 (연관 쿠폰 조회)
        private String couponTypeCd;       // 쿠폰유형 — COUPON_TYPE_CD {RATE:정률 할인, FIXED:정액 할인, PROD_DISCNT:상품할인쿠폰, ORDER_DISCNT:주문할인쿠폰, DLIV_DISCNT:배송비할인쿠폰, FREE_DLIV:무료배송쿠폰, SIGNUP:회원가입축하쿠폰, VIP:VIP쿠폰 외 2개}
        private BigDecimal discountRate;   // 할인률 (%, 연관 쿠폰 조회)
        private Long discountAmt;          // 할인금액 (연관 쿠폰 조회)
        private LocalDate validFrom;       // 유효기간 시작 (연관 쿠폰 조회)
        private LocalDate validTo;         // 유효기간 종료 (연관 쿠폰 조회)
        private String memberNm;           // 회원명 (연관 회원 조회)
        private String memberEmail;        // 회원 이메일 (연관 회원 조회)
        private String memberPhone;        // 회원 전화번호 (연관 회원 조회)
        private String couponTypeCdNm;     // 쿠폰유형 코드명 (화면 표시용)
        // ── 연관정보 (목록 시 채움) ──
        private PmCouponDto.Item coupon;   // 쿠폰 마스터 단건
    }

}
