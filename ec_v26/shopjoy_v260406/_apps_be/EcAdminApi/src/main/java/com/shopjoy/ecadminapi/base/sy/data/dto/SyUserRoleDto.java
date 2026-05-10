package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SyUserRoleDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String userRoleId;
        @Size(max = 21) private String userId;
        @Size(max = 21) private String roleId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_user_role ──────────────────────────────────────────
        private String userRoleId;
        private String userId;
        private String roleId;
        private String grantUserId;
        private LocalDateTime grantDate;
        private LocalDate validFrom;
        private LocalDate validTo;
        private String userRoleRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────────────
        private String roleNm;
        private String roleCode;
        private String grantUserNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
