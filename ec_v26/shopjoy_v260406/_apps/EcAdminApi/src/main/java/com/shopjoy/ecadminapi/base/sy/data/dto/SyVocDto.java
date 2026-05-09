package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyVocDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String vocId;
        @Size(max = 50) private String vocMasterCd;
        @Size(max = 50) private String vocDetailCd;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_voc ──────────────────────────────────────────
        private String vocId;
        private String siteId;
        private String vocMasterCd;
        private String vocDetailCd;
        private String vocNm;
        private String vocContent;
        private String useYn;
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
