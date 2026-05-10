package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyAttachDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String attachId;
        @Size(max = 21) private String attachGrpId;
        @Size(max = 50) private String mimeTypeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_attach ──────────────────────────────────────────
        private String attachId;
        private String siteId;
        private String attachGrpId;
        private String fileNm;
        private Long fileSize;
        private String fileExt;
        private String mimeTypeCd;
        private String storedNm;
        private String attachUrl;
        private String storagePath;
        private String physicalPath;
        private String cdnHost;
        private String cdnImgUrl;
        private String cdnThumbUrl;
        private String thumbFileNm;
        private String thumbStoredNm;
        private String thumbUrl;
        private String thumbCdnUrl;
        private String thumbGeneratedYn;
        private Integer sortOrd;
        private String attachMemo;
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
