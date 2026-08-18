package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhUserLoginLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21)  private String siteId;  // 사이트ID
        @Size(max = 21)  private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        @Size(max = 21)  private String userId;  // 사용자ID (로그인 실패 시 NULL)
        @Size(max = 20)  private String resultCd;  // 결과 (코드: LOGIN_RESULT)
        @Size(max = 50)  private String ip;  // IP주소
        @Size(max = 200) private String uiNm;  // 화면명 (X-UI-Nm 헤더)
        @Size(max = 100) private String traceId;  // 추적ID (분산추적)
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_user_login_log ──────────────────────────────────────────
        private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        private String userId;  // 사용자ID (로그인 실패 시 NULL)
        private String loginId;  // 입력한 로그인ID
        private LocalDateTime loginDate;  // 로그인 시도일시
        private String resultCd;  // 결과 (코드: LOGIN_RESULT)
        private Integer failCnt;  // 해당 시점 연속 실패 횟수
        private String ip;  // IP주소
        private String device;  // User-Agent 전문
        private String os;  // OS 정보
        private String browser;  // 브라우저 정보
        private String accessToken;  // 액세스 토큰 (SHA-256 해시값 저장 권장, 로그인 실패 시 NULL)
        private LocalDateTime accessTokenExp;  // 액세스 토큰 만료일시
        private String refreshToken;  // 리프레시 토큰 (SHA-256 해시값 저장 권장)
        private LocalDateTime refreshTokenExp;  // 리프레시 토큰 만료일시
        private String uiNm;  // 화면명 (X-UI-Nm 헤더)
        private String cmdNm;  // 기능명 (X-Cmd-Nm 헤더)
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────────
        private String userNm;  // 사용자명 (조인)
        private String resultCdNm;  // 결과코드명 (조인)
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
