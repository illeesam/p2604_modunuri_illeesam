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

public class PmDiscntDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;   // 사이트ID
        @Size(max = 1) private String useYn;     // 사용여부 필터 Y/N
        @Size(max = 21) private String discntId; // 할인ID 필터
        private List<String> discntIds;            // PK 다건 IN
        @Size(max = 20) private String discntTypeCd;   // 할인유형 필터 — DISCNT_TYPE {PROD:상품할인, ORDER:주문할인, SHIP:배송비할인, SHIP_FREE:무료배송, AMOUNT:정액할인, RATE:정률할인}
        @Size(max = 20) private String discntStatusCd; // 상태 필터 — DISCNT_STATUS_CD {ACTIVE:진행중, INACTIVE:비활성, EXPIRED:종료}
        @Size(max = 21)  private String memberId;       // 사용회원 ID 필터 (EXISTS eq via pm_discnt_usage)
        @Size(max = 200) private String memberNm;       // 사용회원명 필터 (EXISTS LIKE via pm_discnt_usage→mb_member)
        @Size(max = 21)  private String prodId;         // 대상상품 ID 필터 (EXISTS eq via pm_discnt_prod)
        @Size(max = 200) private String prodNm;         // 대상상품명 필터 (EXISTS LIKE via pm_discnt_prod→pd_prod)
        @Size(max = 21)  private String vendorId;       // 업체 ID 필터 (EXISTS eq via pm_discnt_prod→pd_prod)
        @Size(max = 200) private String vendorNm;       // 업체명 필터 (EXISTS LIKE via pm_discnt_prod→pd_prod→sy_vendor)
        @Size(max = 21)  private String mdUserId;       // 담당MD ID 필터 (EXISTS eq via pm_discnt_prod→pd_prod)
        @Size(max = 200) private String mdUserNm;       // 담당MD명 필터 (EXISTS LIKE via pm_discnt_prod→pd_prod→sy_user)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String discntId;             // 할인ID (YYMMDDhhmmss+rand4)
        private String discntNm;             // 할인명
        private String discntTypeCd;         // 할인유형 — DISCNT_TYPE {PROD:상품할인, ORDER:주문할인, SHIP:배송비할인, SHIP_FREE:무료배송, AMOUNT:정액할인, RATE:정률할인}
        private String discntValTypeCd;      // 할인방식 — DISCNT_VAL_TYPE {RATE:정률, AMOUNT:정액, SHIP_FREE:해당없음}
        private String discntTargetCd;       // 할인대상 — DISCNT_TARGET_CD {ALL:전체, CATEGORY:카테고리, PRODUCT:상품, MEMBER_GRADE:회원등급, BEST:베스트상품, CLEARANCE:균일가/재고정리, DEVICE:기기별, LIMITED:한정수량 외 2개}
        private BigDecimal discntValue;      // 할인값 (정률이면 %, 정액이면 원)
        private Long minOrderAmt;            // 최소주문금액
        private Integer minOrderQty;         // 최소주문수량 (NULL=제한없음)
        private Long maxDiscntAmt;           // 최대할인한도 (NULL=무제한)
        private LocalDate startDate;         // 할인 시작일시
        private LocalDate endDate;           // 할인 종료일시
        private String discntStatusCd;       // 상태 — DISCNT_STATUS_CD {ACTIVE:진행중, INACTIVE:비활성, EXPIRED:종료}
        private String discntStatusCdBefore; // 변경 전 상태
        private String discntDesc;           // 할인 설명
        private String memGradeCd;           // 적용 회원등급 코드 (NULL=전체) — MEMBER_GRADE {BASIC:일반, GOLD:우수, NORMAL:일반, VIP:VIP, BRONZE:브론즈, SILVER:실버}
        private BigDecimal selfCdivRate;     // 자사(사이트) 분담율 (%) — 기본 100%
        private BigDecimal sellerCdivRate;   // 판매자(업체) 분담율 (%) — 기본 0%
        private String dvcPcYn;              // PC 채널 적용여부 Y/N
        private String dvcMwebYn;            // 모바일WEB 적용여부 Y/N
        private String dvcMappYn;            // 모바일APP 적용여부 Y/N
        private String useYn;                // 사용여부 Y/N
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
    }

}
