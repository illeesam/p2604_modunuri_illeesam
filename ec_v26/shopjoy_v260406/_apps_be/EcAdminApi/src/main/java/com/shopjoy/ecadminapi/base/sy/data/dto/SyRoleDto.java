package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyRoleDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String roleId;  // 역할ID (YYMMDDhhmmss+rand4)
        @Size(max = 21) private String parentRoleId;  // 상위역할ID
        @Size(max = 21) private String pathId;  // 점(.) 구분 표시경로 (트리 빌드용)
        @Size(max = 50) private String roleCode;  // 역할코드
        @Size(max = 50) private String roleTypeCd;  // 역할유형 (코드: ROLE_TYPE — SYSTEM/CUSTOM)
        @Size(max = 1)  private String useYn;  // 사용여부 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_role ──────────────────────────────────────────
        private String roleId;  // 역할ID (YYMMDDhhmmss+rand4)
        private String roleCode;  // 역할코드
        private String roleNm;  // 역할명
        private String parentRoleId;  // 상위역할ID
        private String roleTypeCd;  // 역할유형 (코드: ROLE_TYPE — SYSTEM/CUSTOM)
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String restrictPerm;  // 제한권한여부 Y/N
        private String sensitiveViewYn;  // 민감정보(연락처/주소/계좌 등) 원본 열람 권한 Y/N
        private String roleRemark;  // 비고
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일
        private String pathId;  // 점(.) 구분 표시경로 (트리 빌드용)

        // ── JOIN ──────────────────────────────────────────────
    }

}
