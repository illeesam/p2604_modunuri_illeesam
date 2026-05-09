package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MbMemberDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String memberId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String memberId;
        private String siteId;
        private String loginId;
        private String memberNm;
        private String memberPhone;
        private String memberGender;
        private LocalDate birthDate;
        private String gradeCd;
        private String memberStatusCd;
        private String memberStatusCdBefore;
        private LocalDateTime joinDate;
        private LocalDateTime lastLogin;
        private Integer orderCount;
        private Long totalPurchaseAmt;
        private Long cacheBalanceAmt;
        private String memberZipCode;
        private String memberAddr;
        private String memberAddrDetail;
        private String memberMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String siteNm;
        private String gradeCdNm;
        private String memberStatusCdNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
