package com.shopjoy.ecadminapi.base.sy.data.dto;

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
        @Size(max = 21) private String vendorUserRoleId;  // 업체사용자역할ID 검색값
        @Size(max = 21) private String vendorId;  // 업체ID 검색값
        @Size(max = 21) private String userId;  // 사용자ID 검색값
        @Size(max = 21) private String roleId;  // 역할ID 검색값
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor_user_role ─────────────────────────────────────
        private String vendorUserRoleId;  // 업체사용자역할ID (PK)
        private String vendorId;  // 업체ID (sy_vendor.vendor_id)
        private String userId;  // 업체사용자ID (sy_vendor_user.vendor_user_id)
        private String roleId;  // 역할ID (sy_role.role_id)
        private String grantUserId;  // 역할 부여자 (sy_user.user_id)
        private LocalDateTime grantDate;  // 역할 부여일시
        private LocalDate validFrom;  // 유효 시작일
        private LocalDate validTo;  // 유효 종료일
        private String vendorUserRoleRemark;  // 비고
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ────────────────────────────────────────────────────
        private String vendorNm;  // 업체명 (JOIN)
        private String memberNm;  // 담당자명 (JOIN)
        private String roleNm;  // 역할명 (JOIN)
        private String grantUserNm;  // 부여자명 (JOIN)
    }

}
