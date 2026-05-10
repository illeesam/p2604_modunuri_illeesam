package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyNoticeDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String noticeId;
        @Size(max = 50) private String noticeTypeCd;
        @Size(max = 20) private String status;
        @Size(max = 1)  private String isFixed;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_notice ──────────────────────────────────────────
        private String noticeId;
        private String siteId;
        private String noticeTitle;
        private String noticeTypeCd;
        private String isFixed;
        private String contentHtml;
        private String attachGrpId;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String noticeStatusCd;
        private Integer viewCount;
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
