package com.shopjoy.ecadminapi.base.sy.data.dto;

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

        @Size(max = 21, message = "deptId 는 21자 이내여야 합니다.")
        private String deptId;

        @Size(max = 20, message = "status 는 20자 이내여야 합니다.")
        private String status;

        @Size(max = 100, message = "role 은 100자 이내여야 합니다.")
        private String role;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_user ──────────────────────────────────────────
        private String userId;
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
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;
        private String authMethodCd;
        private LocalDateTime lastLoginDate;
        private String profileAttachId;

        // ── JOIN ─────────────────────────────────────────────────────
        private String deptNm;
        private String roleNm;
        private String userStatusCdNm;
        private String authMethodCdNm;
    }

    /* 페이징 응답은 공통 타입을 쓴다 — BasePage<SyUserDto.Item>.
       DTO 마다 빈 PageResponse 클래스를 두지 않는다(common/data/BasePage 주석 참조). */
}
