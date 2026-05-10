package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SyVendorUserDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String vendorId;
        @Size(max = 21) private String vendorUserId;
        @Size(max = 21) private String userId;
        @Size(max = 20) private String status;
        @Size(max = 1)  private String authYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor_user ──────────────────────────────────────────
        private String vendorUserId;
        private String siteId;
        private String vendorId;
        private String userId;
        private String memberNm;
        private String positionCd;
        private String vendorUserDeptNm;
        private String vendorUserPhone;
        private String vendorUserMobile;
        private String vendorUserEmail;
        private LocalDate birthDate;
        private String isMain;
        private String authYn;
        private LocalDate joinDate;
        private LocalDate leaveDate;
        private String vendorUserStatusCd;
        private String vendorUserRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String vendorNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
