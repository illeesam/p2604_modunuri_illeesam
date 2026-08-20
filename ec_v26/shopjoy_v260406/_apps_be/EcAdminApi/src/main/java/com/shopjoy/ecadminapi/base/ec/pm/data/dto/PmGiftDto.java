package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PmGiftDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;   // 사이트ID
        @Size(max = 1) private String useYn;     // 사용여부 필터 Y/N
        @Size(max = 21) private String giftId;   // 사은품ID 필터
        @Size(max = 20) private String giftTypeCd;   // 사은품유형 필터 — GIFT_TYPE_CD {PRODUCT:상품, SAMPLE:샘플, ETC:기타, LIMITED:한정수량, NEW_MEMBER:신규회원, NORMAL:일반, REVIEW:리뷰작성, SEASONAL:시즌 외 1개}
        @Size(max = 20) private String giftStatusCd; // 상태 필터 — GIFT_STATUS_CD {ACTIVE:활성, INACTIVE:비활성, ENDED:종료, SOLDOUT:품절}
        /* 상품별 사은품 조회 — 화면(PmGiftMng)에 검색란이 있었으나 필드가 없어 무시되던 것을 추가 */
        @Size(max = 21) private String prodId;  // 연결 상품ID 필터 (pd_prod.prod_id)
        @Size(max = 21)  private String vendorId;  // 업체 ID 필터 (base 조인 pd_prod.vendor_id)
        @Size(max = 200) private String vendorNm;  // 업체명 필터 (base 조인 sy_vendor.vendor_nm)
        @Size(max = 21)  private String mdUserId;  // 담당MD ID 필터 (base 조인 pd_prod.md_user_id)
        @Size(max = 200) private String mdUserNm;  // 담당MD명 필터 (base 조인 sy_user.user_nm)
        @Size(max = 21)  private String memberId;  // 발급회원 ID 필터 (EXISTS eq via pm_gift_issue)
        @Size(max = 200) private String memberNm;  // 발급회원명 필터 (EXISTS LIKE via pm_gift_issue→mb_member)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String giftId;               // 사은품ID (YYMMDDhhmmss+rand4)
        private String giftNm;               // 사은품명
        private String giftTypeCd;           // 사은품유형 — GIFT_TYPE_CD {PRODUCT:상품, SAMPLE:샘플, ETC:기타, LIMITED:한정수량, NEW_MEMBER:신규회원, NORMAL:일반, REVIEW:리뷰작성, SEASONAL:시즌 외 1개}
        private String prodId;               // 연결 상품ID (pd_prod.prod_id)
        private Integer giftStock;           // 사은품 재고
        private String giftDesc;             // 사은품 설명
        private LocalDate startDate;         // 시작일시
        private LocalDate endDate;           // 종료일시
        private String giftStatusCd;         // 상태 — GIFT_STATUS_CD {ACTIVE:활성, INACTIVE:비활성, ENDED:종료, SOLDOUT:품절}
        private String giftStatusCdBefore;   // 변경 전 상태
        private String memGradeCd;           // 적용 회원등급 코드 (NULL=전체) — MEMBER_GRADE {BASIC:일반, GOLD:우수, NORMAL:일반, VIP:VIP, BRONZE:브론즈, SILVER:실버}
        private Long minOrderAmt;            // 최소주문금액 — 사은품 지급 기준 금액
        private Integer minOrderQty;         // 최소주문수량 (NULL=제한없음)
        private BigDecimal selfCdivRate;     // 자사(사이트) 분담율 (%) — 기본 100%
        private BigDecimal sellerCdivRate;   // 판매자(업체) 분담율 (%) — 기본 0%
        private String useYn;                // 사용여부 Y/N
        private String vendorId;             // 판매업체 (sy_vendor.vendor_id)
        private String chargeStaff;          // 판매담당자명 (업체 선택 시 자동 채움, 수정 가능)
        private String visibilityTargets;    // 공개대상 (^코드^코드^ 형식, 예: ^PUBLIC^)
        private String regBy;                // 등록자
        private LocalDateTime regDate;       // 등록일
        private String regSiteId;            // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                // 수정자
        private LocalDateTime updDate;       // 수정일
    }

}
