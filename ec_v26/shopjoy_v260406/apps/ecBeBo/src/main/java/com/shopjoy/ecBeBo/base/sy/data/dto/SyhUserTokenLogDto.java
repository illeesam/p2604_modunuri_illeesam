package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhUserTokenLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21)  private String siteId;  // 사이트ID
        @Size(max = 21)  private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        @Size(max = 21)  private String userId;  // 사용자ID (sy_user.user_id)
        @Size(max = 20)  private String actionCd;  // 토큰 액션 (코드: TOKEN_ACTION — ISSUE/REFRESH/REVOKE/EXPIRE)
        @Size(max = 20)  private String tokenTypeCd;  // 토큰 유형 (코드: APP_TYPE — ACCESS/REFRESH)
        @Size(max = 50)  private String ip;  // IP주소
        @Size(max = 200) private String uiNm;  // 화면명 (X-UI-Nm 헤더)
        @Size(max = 100) private String traceId;  // 추적ID (분산추적)
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_user_token_log ──────────────────────────────────────────
        private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        private String userId;  // 사용자ID (sy_user.user_id)
        private String loginLogId;  // 최초 로그인 로그ID (sy_user_login_log.log_id)
        private String actionCd;  // 토큰 액션 (코드: TOKEN_ACTION — ISSUE/REFRESH/REVOKE/EXPIRE)
        private String tokenTypeCd;  // 토큰 유형 (코드: APP_TYPE — ACCESS/REFRESH)
        private String accessToken;  // 토큰값 (SHA-256 해시 저장 권장)
        private LocalDateTime tokenExp;  // 토큰 만료일시
        private String prevToken;  // 갱신 전 토큰 해시 (REFRESH 액션 시)
        private String refreshToken;  // 리푸레쉬 토큰
        private String ip;  // IP주소
        private String deviceInfo;  // User-Agent
        private String revokeReasonCd;  // 폐기 사유 (LOGOUT/FORCE/EXPIRED 등)
        private LocalDateTime accessTokenExp;  // 액세스 토큰 만료일시
        private String uiNm;  // 화면명 (X-UI-Nm 헤더)
        private String cmdNm;  // 기능명 (X-Cmd-Nm 헤더)
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ─────────────────────────────────────────────────────────
        private String userNm;  // 사용자명 (조인)
        private String actionCdNm;  // 액션명 (조인)
        private String tokenTypeCdNm;  // 토큰유형명 (조인)
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
