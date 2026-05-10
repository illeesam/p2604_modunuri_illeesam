package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyCodeDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String codeId;
        @Size(max = 50) private String codeGrp;
        @Size(max = 50) private String codeValue;
        @Size(max = 50) private String parentCodeValue;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_code ──────────────────────────────────────────
        private String codeId;
        private String siteId;
        private String codeGrp;
        private String codeValue;
        private String codeLabel;
        private Integer sortOrd;
        private String useYn;
        private String parentCodeValue;
        private String childCodeValues;
        private String codeRemark;
        private Integer codeLevel;
        private String codeOpt1;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
        private String grpNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
