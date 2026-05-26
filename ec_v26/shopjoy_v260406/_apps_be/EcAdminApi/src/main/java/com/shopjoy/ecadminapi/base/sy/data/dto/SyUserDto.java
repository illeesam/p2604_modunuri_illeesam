package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyUserDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
        private String siteId;

        @Size(max = 21, message = "deptId 는 21자 이내여야 합니다.")
        private String deptId;

        @Size(max = 20, message = "status 는 20자 이내여야 합니다.")
        private String status;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_user ──────────────────────────────────────────
        private String userId;
        private String siteId;
        private String loginId;
        private String loginPwdHash;
        private String userNm;
        private String userEmail;
        private String userPhone;
        private String deptId;
        private String roleId;
        private String userStatusCd;
        private LocalDateTime lastLogin;
        private Integer loginFailCnt;
        private String userMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String authMethodCd;
        private LocalDateTime lastLoginDate;
        private String profileAttachId;

        // ── JOIN ─────────────────────────────────────────────────────
        private String siteNm;
        private String deptNm;
        private String roleNm;
        private String userStatusCdNm;
        private String authMethodCdNm;
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo). 단순목록/페이징 결과 모두 pageList 에 담김 */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
