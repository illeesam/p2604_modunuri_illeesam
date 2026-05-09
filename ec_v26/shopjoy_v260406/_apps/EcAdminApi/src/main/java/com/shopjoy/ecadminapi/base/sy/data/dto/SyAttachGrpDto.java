package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyAttachGrpDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String attachGrpId;
        @Size(max = 50) private String attachGrpCode;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_attach_grp ──────────────────────────────────────────
        private String attachGrpId;
        private String attachGrpCode;
        private String attachGrpNm;
        private String fileExtAllow;
        private Long maxFileSize;
        private Integer maxFileCount;
        private String storagePath;
        private String useYn;
        private Integer sortOrd;
        private String attachGrpRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
