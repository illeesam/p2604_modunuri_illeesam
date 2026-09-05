package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StSettleConfigDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;                // 사이트ID 필터
        @Size(max = 1) private String useYn;                   // 사용여부 필터 Y/N
        @Size(max = 21) private String settleConfigId;         // 정산기준ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleConfigId;             // 정산기준ID (YYMMDDhhmmss+rand4)
        private String vendorId;                      // 업체ID (NULL=전체 기준)
        private String categoryId;                     // 카테고리ID (NULL=전체 기준)
        private String settleCycleCd;                    // 정산주기 — SETTLE_CYCLE_CD (DAILY/WEEKLY/MONTHLY)
        private String settleCycleCdNm;  // 코드 라벨
        private Integer settleDay;                         // 정산일 (월 N일, MONTHLY 시 사용)
        private BigDecimal commissionRate;                   // 수수료율 (%)
        private Long minSettleAmt;                             // 최소 정산금액
        private String settleConfigRemark;                      // 비고
        private String useYn;                                    // 사용여부 Y/N
        private String regBy;                                     // 등록자
        private LocalDateTime regDate;                             // 등록일시
        private String regSiteId;                                  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                                        // 수정자
        private LocalDateTime updDate;                               // 수정일시
        private String vendorNm;  // 업체명 (조인)
        private String categoryNm;  // 카테고리명 (조인)
    }

}
