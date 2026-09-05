package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
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
        private String deptId;  // 부서ID 검색값

        @Size(max = 20, message = "status 는 20자 이내여야 합니다.")
        private String status;  // 상태 검색값 — USER_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}

        @Size(max = 100, message = "role 은 100자 이내여야 합니다.")
        private String role;  // 역할ID 검색값 (sy_role.role_id)
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_user ──────────────────────────────────────────
        private String userId;  // 사용자ID (YYMMDDhhmmss+rand4)
        private String loginId;  // 로그인 아이디
        private String loginPwdHash;  // 비밀번호 (bcrypt)
        private String userNm;  // 사용자명
        private String userEmail;  // 이메일
        private String userPhone;  // 연락처
        private String deptId;  // 부서ID (sy_dept.dept_id)
        private String roleId;  // 역할ID (sy_role.role_id)
        private String userStatusCd;  // 상태 — USER_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        private LocalDateTime lastLogin;  // 최근 로그인
        private Integer loginFailCnt;  // 로그인 실패 횟수
        private String userMemo;  // 메모
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String authMethodCd;  // 인증방식 — AUTH_METHOD_CD {EMAIL:이메일, GOOGLE:구글, KAKAO:카카오, NAVER:네이버, MAIN:기본인증}
        private LocalDateTime lastLoginDate;  // 마지막 로그인 일시
        private String profileAttachId;  // 프로필 첨부아이디

        // ── JOIN ─────────────────────────────────────────────────────
        private String deptNm;  // 부서명 (JOIN)
        private String roleNm;  // 역할명 (JOIN)
        private String userStatusCdNm;  // 상태 코드명 (JOIN)
        private String authMethodCdNm;  // 인증방식 코드명 (JOIN)
    }

    /* 페이징 응답은 공통 타입을 쓴다 — BasePage<SyUserDto.Item>.
       DTO 마다 빈 PageResponse 클래스를 두지 않는다(common/data/BasePage 주석 참조). */
}
