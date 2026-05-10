package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyRoleMenuDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String roleMenuId;
        @Size(max = 21) private String roleId;
        @Size(max = 21) private String menuId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_role_menu ──────────────────────────────────────────
        private String roleMenuId;
        private String siteId;
        private String roleId;
        private String menuId;
        private Integer permLevel;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String roleNm;
        private String menuNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
