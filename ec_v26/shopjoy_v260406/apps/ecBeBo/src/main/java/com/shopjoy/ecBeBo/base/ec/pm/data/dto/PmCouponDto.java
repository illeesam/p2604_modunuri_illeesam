package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PmCouponDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;   // 사이트ID
        @Size(max = 1) private String useYn;     // 사용여부 필터 Y/N
        @Size(max = 21) private String couponId; // 쿠폰ID 필터
        private List<String> couponIds;                // PK 다건 IN
        @Size(max = 21) private String memberId; // 회원ID 필터 — 이 회원에게 발급(pm_coupon_issue)되었고 아직 미사용인 쿠폰만 (EXISTS)
        @Size(max = 20) private String couponStatusCd; // 상태 — COUPON_STATUS_CD {ACTIVE:활성, INACTIVE:비활성, EXPIRED:만료}
        @Size(max = 20) private String applyScopeCd;   // 적용범위 필터 — COUPON_APPLY_SCOPE_CD {ORDER:주문할인, PRODUCT:상품할인, DELIVERY:배송비할인}
        @Size(max = 21)  private String prodId;         // 대상상품 ID 필터 (EXISTS eq via pm_coupon_prod)
        @Size(max = 200) private String prodNm;         // 대상상품명 필터 (EXISTS LIKE via pm_coupon_prod→pd_prod)
        @Size(max = 21)  private String vendorId;       // 업체 ID 필터 (EXISTS eq via pm_coupon_prod→pd_prod)
        @Size(max = 200) private String vendorNm;       // 업체명 필터 (EXISTS LIKE via pm_coupon_prod→pd_prod→sy_vendor)
        @Size(max = 21)  private String mdUserId;       // 담당MD ID 필터 (EXISTS eq via pm_coupon_prod→pd_prod)
        @Size(max = 200) private String mdUserNm;       // 담당MD명 필터 (EXISTS LIKE via pm_coupon_prod→pd_prod→sy_user)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String couponId;             // 쿠폰ID (YYMMDDhhmmss+rand4)
        private String couponCd;             // 쿠폰코드
        private String couponNm;             // 쿠폰명
        private String couponTypeCd;         // 쿠폰유형 — COUPON_TYPE_CD {RATE:정률 할인, FIXED:정액 할인, PROD_DISCNT:상품할인쿠폰, ORDER_DISCNT:주문할인쿠폰, DLIV_DISCNT:배송비할인쿠폰, FREE_DLIV:무료배송쿠폰, SIGNUP:회원가입축하쿠폰, VIP:VIP쿠폰 외 2개}
        private BigDecimal discountRate;     // 할인률 (%)
        private Long discountAmt;            // 할인금액
        private Long minOrderAmt;            // 최소주문금액
        private Integer minOrderQty;         // 최소주문수량 (NULL=제한없음)
        private Long maxDiscountAmt;         // 최대할인한도 (NULL=무제한)
        private Integer issueLimit;          // 총발급한도 (NULL=무제한)
        private Integer issueCnt;            // 발급된 개수
        private Integer maxIssuePerMem;      // 회원당 최대발급수 (NULL=무제한)
        private String couponDesc;           // 쿠폰설명
        private LocalDate validFrom;         // 유효기간 시작
        private LocalDate validTo;           // 유효기간 종료
        private String couponStatusCd;       // 상태 — COUPON_STATUS_CD {ACTIVE:활성, INACTIVE:비활성, EXPIRED:만료}
        private String couponStatusCdBefore; // 변경 전 쿠폰상태
        private String useYn;                // 사용여부 Y/N
        private String targetTypeCd;         // 적용대상 — PROMO_TARGET_TYPE {ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급}
        private String applyScopeCd;         // 적용범위 — COUPON_APPLY_SCOPE_CD {ORDER:주문할인, PRODUCT:상품할인, DELIVERY:배송비할인}
        private String applyScopeCdNm;       // 적용범위 코드명 (화면 표시용)
        private String targetValue;          // 적용대상값
        private String memGradeCd;           // 적용 회원등급 코드 (NULL=전체) — MEMBER_GRADE {BASIC:일반, GOLD:우수, NORMAL:일반, VIP:VIP, BRONZE:브론즈, SILVER:실버}
        private BigDecimal selfCdivRate;     // 자사(사이트) 분담율 (%) — 기본 100%
        private BigDecimal sellerCdivRate;   // 판매자(업체) 분담율 (%) — 기본 0%
        private String sellerCdivRemark;     // 판매자 분담 비고
        private String dvcPcYn;              // PC 채널 적용여부 Y/N
        private String dvcMwebYn;            // 모바일WEB 적용여부 Y/N
        private String dvcMappYn;            // 모바일APP 적용여부 Y/N
        private String memo;                 // 메모
        private String vendorId;             // 판매업체 (sy_vendor.vendor_id)
        private String chargeStaff;          // 판매담당자명 (업체 선택 시 자동 채움, 수정 가능)
        private String visibilityTargets;    // 공개대상 (^코드^코드^ 형식, 예: ^PUBLIC^)
        private String mdUserId;             // 담당MD (sy_user.user_id)
        private String regBy;                // 등록자
        private LocalDateTime regDate;       // 등록일
        private String regSiteId;            // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                // 수정자
        private LocalDateTime updDate;       // 수정일
        private String couponTypeCdNm;       // 쿠폰유형 코드명 (화면 표시용)
        private String couponStatusCdNm;     // 쿠폰상태 코드명 (화면 표시용)
        private String targetTypeCdNm;       // 적용대상 코드명 (화면 표시용)
        private String memGradeCdNm;         // 회원등급 코드명 (화면 표시용)
    }

}
