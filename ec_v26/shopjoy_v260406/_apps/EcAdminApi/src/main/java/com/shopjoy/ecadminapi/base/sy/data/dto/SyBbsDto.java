package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyBbsDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String bbsId;
        @Size(max = 21) private String pathId;
        @Size(max = 20) private String status;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_bbs ──────────────────────────────────────────
        private String bbsId;
        private String siteId;
        private String bbmId;
        private String parentBbsId;
        private String memberId;
        private String authorNm;
        private String bbsTitle;
        private String contentHtml;
        private String attachGrpId;
        private Integer viewCount;
        private Integer likeCount;
        private Integer commentCount;
        private String isFixed;
        private String bbsStatusCd;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String pathId;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
        private String bbmNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
