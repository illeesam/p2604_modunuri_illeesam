package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyRoleMenuDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String roleMenuId;  // 역할메뉴ID
        @Size(max = 21) private String roleId;  // 역할ID
        @Size(max = 21) private String menuId;  // 메뉴ID
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_role_menu ──────────────────────────────────────────
        private String roleMenuId;  // 역할메뉴ID
        private String roleId;  // 역할ID
        private String menuId;  // 메뉴ID
        private Integer permLevel;  // 권한레벨 (1:조회/2:수정/3:삭제)
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
        private String roleNm;  // 역할명 (조인)
        private String menuNm;  // 메뉴명 (조인)
    }

}
