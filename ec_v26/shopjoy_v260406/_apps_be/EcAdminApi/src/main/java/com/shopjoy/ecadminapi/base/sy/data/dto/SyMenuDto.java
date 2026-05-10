package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyMenuDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String menuId;
        @Size(max = 21) private String parentMenuId;
        @Size(max = 50) private String menuCode;
        @Size(max = 50) private String menuTypeCd;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_menu ──────────────────────────────────────────
        private String menuId;
        private String siteId;
        private String menuCode;
        private String menuNm;
        private String parentMenuId;
        private String menuUrl;
        private String menuTypeCd;
        private String iconClass;
        private Integer sortOrd;
        private String useYn;
        private String menuRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
        private String parentMenuNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
