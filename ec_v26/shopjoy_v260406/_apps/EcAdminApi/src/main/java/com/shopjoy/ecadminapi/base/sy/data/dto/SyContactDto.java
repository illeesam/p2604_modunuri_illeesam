package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyContactDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String contactId;
        @Size(max = 21) private String memberId;
        @Size(max = 50) private String categoryCd;
        @Size(max = 20) private String status;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_contact ──────────────────────────────────────────
        private String contactId;
        private String siteId;
        private String memberId;
        private String memberNm;
        private String categoryCd;
        private String contactTitle;
        private String contactContent;
        private String attachGrpId;
        private String contactStatusCd;
        private String contactAnswer;
        private String answerUserId;
        private LocalDateTime answerDate;
        private LocalDateTime contactDate;
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
