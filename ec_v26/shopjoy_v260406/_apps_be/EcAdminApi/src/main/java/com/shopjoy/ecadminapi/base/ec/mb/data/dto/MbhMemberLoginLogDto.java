package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MbhMemberLoginLogDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String logId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String logId;
        private String siteId;
        private String memberId;
        private String loginId;
        private LocalDateTime loginDate;
        private String resultCd;
        private Integer failCnt;
        private String ip;
        private String device;
        private String os;
        private String browser;
        private String country;
        private String accessToken;
        private LocalDateTime accessTokenExp;
        private String refreshToken;
        private LocalDateTime refreshTokenExp;
        private String uiNm;
        private String cmdNm;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String siteNm;
        private String memberNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
