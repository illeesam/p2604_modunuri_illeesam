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
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String giftId;
        @Size(max = 20) private String giftTypeCd;
        @Size(max = 20) private String giftStatusCd;
        /* 상품별 사은품 조회 — 화면(PmGiftMng)에 검색란이 있었으나 필드가 없어 무시되던 것을 추가 */
        @Size(max = 21) private String prodId;
        @Size(max = 21)  private String vendorId;  // 업체 ID 필터 (base 조인 pd_prod.vendor_id)
        @Size(max = 200) private String vendorNm;  // 업체명 필터 (base 조인 sy_vendor.vendor_nm)
        @Size(max = 21)  private String mdUserId;  // 담당MD ID 필터 (base 조인 pd_prod.md_user_id)
        @Size(max = 200) private String mdUserNm;  // 담당MD명 필터 (base 조인 sy_user.user_nm)
        @Size(max = 21)  private String memberId;  // 발급회원 ID 필터 (EXISTS eq via pm_gift_issue)
        @Size(max = 200) private String memberNm;  // 발급회원명 필터 (EXISTS LIKE via pm_gift_issue→mb_member)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String giftId;
        private String giftNm;
        private String giftTypeCd;
        private String prodId;
        private Integer giftStock;
        private String giftDesc;
        private LocalDate startDate;
        private LocalDate endDate;
        private String giftStatusCd;
        private String giftStatusCdBefore;
        private String memGradeCd;
        private Long minOrderAmt;
        private Integer minOrderQty;
        private BigDecimal selfCdivRate;
        private BigDecimal sellerCdivRate;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;
    }

}
