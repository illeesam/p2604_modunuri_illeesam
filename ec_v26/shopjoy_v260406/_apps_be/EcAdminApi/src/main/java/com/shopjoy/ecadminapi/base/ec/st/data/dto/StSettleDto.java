package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StSettleDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;            // 사이트ID 필터
        @Size(max = 21) private String settleId;          // 정산ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleId;                    // 정산ID (YYMMDDhhmmss+rand4)
        private String vendorId;                      // 업체ID (sy_vendor.vendor_id)
        private String settleYm;                        // 정산년월 (YYYYMM)
        private LocalDateTime settleStartDate;            // 정산 기준 시작일
        private LocalDateTime settleEndDate;               // 정산 기준 종료일
        private Long totalOrderAmt;                         // 총 주문금액 (당월 신규 주문 귀속)
        private Long totalReturnAmt;                          // 총 환불금액 (환불 확정월 귀속 — 타월 주문 환불 포함)
        private Integer totalClaimCnt;                         // 환불 건수 (st_settle_raw.raw_type_cd=CLAIM 집계)
        private Long totalDiscntAmt;                             // 총 할인금액
        private BigDecimal commissionRate;                        // 적용 수수료율 (%)
        private Long commissionAmt;                                // 수수료금액
        private Long settleAmt;                                     // 기본 정산금액
        private Long adjAmt;                                         // 정산조정 합계
        private Long etcAdjAmt;                                       // 기타조정 합계
        private Long finalSettleAmt;                                   // 최종 정산금액
        private String settleStatusCd;                                 // 상태 — SETTLE_STATUS_CD (DRAFT/CONFIRMED/CLOSED/PAID)
        private String settleStatusCdBefore;                             // 변경 전 상태
        private String settleMemo;                                        // 정산 메모
        private String regBy;                                              // 등록자
        private LocalDateTime regDate;                                      // 등록일시
        private String regSiteId;                                           // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                                                 // 수정자
        private LocalDateTime updDate;                                        // 수정일시
    }

}
