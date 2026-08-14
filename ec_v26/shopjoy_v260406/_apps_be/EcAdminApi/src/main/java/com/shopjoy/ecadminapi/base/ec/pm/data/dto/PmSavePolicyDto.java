package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PmSavePolicyDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String saveId;
        @Size(max = 20) private String saveTypeCd;
        @Size(max = 20) private String saveStatus;
        @Size(max = 1)  private String useYn;
        @Size(max = 21)  private String vendorId;  // 업체 ID 필터
        @Size(max = 200) private String vendorNm;  // 업체명 필터
        @Size(max = 21)  private String prodId;    // 대상상품 ID 필터 (pm_save_prod 조인)
        @Size(max = 200) private String prodNm;    // 대상상품명 필터 (pm_save_prod → pd_prod 조인)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String saveId;
        private String saveNm;
        private String saveTypeCd;
        private String saveType;
        private BigDecimal saveVal;
        private String saveUnit;
        private Long minOrderAmt;
        private Integer expireDay;
        private String saveStatus;
        private LocalDate startDate;
        private LocalDate endDate;
        private String memGradeCd;
        private String visibilityTargets;
        private String vendorId;
        private String chargeStaff;
        private String remark;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;
    }

}
