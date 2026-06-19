package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyPropDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String propId;
        @Size(max = 21) private String pathId;
        @Size(max = 100) private String propKey;
        @Size(max = 2000) private String propKeys; // 쉼표 구분 복수 키 (IN 조건)
        @Size(max = 50) private String propTypeCd;
        @Size(max = 1)  private String useYn;
        @Size(max = 100) private String propProfile;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_prop ──────────────────────────────────────────
        private String propId;
        private String siteId;
        private String pathId;
        private String propKey;
        private String propValue;
        private String propLabel;
        private String propTypeCd;
        private Integer sortOrd;
        private String useYn;
        private String propRemark;
        private String propProfile;
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
