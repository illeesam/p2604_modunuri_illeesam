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
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String discntId;
        private List<String> discntIds;            // PK 다건 IN
        @Size(max = 20) private String discntTypeCd;
        @Size(max = 20) private String discntStatusCd;
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
        private String discntId;
        private String discntNm;
        private String discntTypeCd;
        private String discntTargetCd;
        private BigDecimal discntValue;
        private Long minOrderAmt;
        private Integer minOrderQty;
        private Long maxDiscntAmt;
        private LocalDate startDate;
        private LocalDate endDate;
        private String discntStatusCd;
        private String discntStatusCdBefore;
        private String discntDesc;
        private String memGradeCd;
        private BigDecimal selfCdivRate;
        private BigDecimal sellerCdivRate;
        private String dvcPcYn;
        private String dvcMwebYn;
        private String dvcMappYn;
        private String useYn;
        private String vendorId;
        private String chargeStaff;
        private String visibilityTargets;
        private String mdUserId;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;
    }

}
