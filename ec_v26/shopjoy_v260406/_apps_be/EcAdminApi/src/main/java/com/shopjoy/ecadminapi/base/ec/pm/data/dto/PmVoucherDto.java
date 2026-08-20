package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PmVoucherDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String voucherId;
        @Size(max = 20) private String voucherStatusCd; // 상태 (코드: VOUCHER_STATUS_CD)
        @Size(max = 21)  private String memberId;  // 발급회원 ID 필터 (EXISTS eq via pm_voucher_issue)
        @Size(max = 200) private String memberNm;  // 발급회원명 필터 (EXISTS LIKE via pm_voucher_issue→mb_member)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String voucherId;
        private String voucherNm;
        private String voucherTypeCd;
        private BigDecimal voucherValue;
        private Long minOrderAmt;
        private Long maxDiscntAmt;
        private Integer expireMonth;
        private String voucherStatusCd;
        private String voucherStatusCdBefore;
        private String voucherDesc;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;
        private LocalDateTime updDate;
    }

}
