package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyBbmDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String bbmId;
        @Size(max = 21) private String pathId;
        @Size(max = 20) private String typeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_bbm ──────────────────────────────────────────
        private String bbmId;
        private String siteId;
        private String bbmCode;
        private String bbmNm;
        private String pathId;
        private String bbmTypeCd;
        private String allowComment;
        private String allowAttach;
        private String allowLike;
        private String contentTypeCd;
        private String scopeTypeCd;
        private Integer sortOrd;
        private String useYn;
        private String bbmRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
