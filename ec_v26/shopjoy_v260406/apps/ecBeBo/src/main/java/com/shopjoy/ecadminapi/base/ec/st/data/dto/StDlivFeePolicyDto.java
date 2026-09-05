package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StDlivFeePolicyDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;         // 사이트ID 필터
        @Size(max = 30) private String dlivMethodCd;    // 배송방법 필터
        @Size(max = 1)  private String useYn;           // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String dlivFeePolicyId;   // 배송수수료정책ID (YYMMDDhhmmss+rand4)
        private String dlivMethodCd;      // 배송방법 — DLIV_METHOD_CD
        private String dlivMethodCdNm;    // 배송방법명 (sy_code 조인)
        private BigDecimal feeRate;       // 수수료율(%)
        private Long feeAmt;              // 수수료 정액(원)
        private String siteId;            // 사이트ID
        private String useYn;             // 사용여부 Y/N
        private Integer sortOrd;          // 정렬순서
        private String remark;            // 비고
        private String regBy;             // 등록자
        private LocalDateTime regDate;    // 등록일시
        private String regSiteId;         // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;             // 수정자
        private LocalDateTime updDate;    // 수정일시
    }

}
