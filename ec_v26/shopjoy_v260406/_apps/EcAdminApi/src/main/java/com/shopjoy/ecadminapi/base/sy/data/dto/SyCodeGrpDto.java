package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyCodeGrpDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String codeGrpId;
        @Size(max = 50) private String codeGrp;
        @Size(max = 21) private String pathId;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_code_grp ──────────────────────────────────────────
        private String codeGrpId;
        private String siteId;
        private String codeGrp;
        private String grpNm;
        private String pathId;
        private String codeGrpDesc;
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
