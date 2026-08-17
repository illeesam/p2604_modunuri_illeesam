package com.shopjoy.ecadminapi.base.sy.data.dto;

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
        @Size(max = 21) private String userRoleId;  // 사용자역할ID 검색값
        @Size(max = 21) private String userId;  // 사용자ID 검색값
        @Size(max = 21) private String roleId;  // 역할ID 검색값
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_user_role ──────────────────────────────────────────
        private String userRoleId;  // 사용자역할ID (YYMMDDhhmmss+rand4)
        private String userId;  // 사용자ID (sy_user.user_id, UNIQUE with role_id)
        private String roleId;  // 역할ID (sy_role.role_id, UNIQUE with user_id)
        private String grantUserId;  // 부여자 (sy_user.user_id)
        private LocalDateTime grantDate;  // 부여일시
        private LocalDate validFrom;  // 적용 시작일
        private LocalDate validTo;  // 적용 종료일
        private String userRoleRemark;  // 비고
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────────────
        private String roleNm;  // 역할명 (JOIN)
        private String roleCode;  // 역할코드 (JOIN)
        private String grantUserNm;  // 부여자명 (JOIN)
    }

}
