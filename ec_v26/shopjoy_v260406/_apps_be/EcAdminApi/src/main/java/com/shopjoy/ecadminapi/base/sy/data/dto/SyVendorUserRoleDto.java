package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SyVendorUserRoleDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String vendorUserRoleId;
        @Size(max = 21) private String vendorId;
        @Size(max = 21) private String userId;
        @Size(max = 21) private String roleId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor_user_role ─────────────────────────────────────
        private String vendorUserRoleId;
        private String vendorId;
        private String userId;
        private String roleId;
        private String grantUserId;
        private LocalDateTime grantDate;
        private LocalDate validFrom;
        private LocalDate validTo;
        private String vendorUserRoleRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ────────────────────────────────────────────────────
        private String vendorNm;
        private String memberNm;
        private String roleNm;
        private String grantUserNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
