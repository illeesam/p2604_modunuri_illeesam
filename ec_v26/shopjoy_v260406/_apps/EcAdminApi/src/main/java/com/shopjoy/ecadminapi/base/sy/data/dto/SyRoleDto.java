package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyRoleDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String roleId;
        @Size(max = 21) private String parentRoleId;
        @Size(max = 21) private String pathId;
        @Size(max = 50) private String roleCode;
        @Size(max = 50) private String roleTypeCd;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_role ──────────────────────────────────────────
        private String roleId;
        private String siteId;
        private String roleCode;
        private String roleNm;
        private String parentRoleId;
        private String roleTypeCd;
        private Integer sortOrd;
        private String useYn;
        private String restrictPerm;
        private String roleRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String pathId;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
