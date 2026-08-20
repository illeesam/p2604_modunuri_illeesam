package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MbhMemberTokenLogDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;           // 사이트ID 필터
        @Size(max = 21) private String logId;            // 로그ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String logId;                       // 로그ID (YYMMDDhhmmss+rand4)
        private String memberId;                     // 회원ID (mb_member.member_id)
        private String loginLogId;                    // 최초 로그인 로그ID (mbh_member_login_log)
        private String actionCd;                        // 토큰 액션 — ACTION_CD {ISSUE:발급, REFRESH:갱신, REVOKE:폐기, EXPIRE:만료}
        private String tokenTypeCd;                      // 토큰 유형 — TOKEN_TYPE {ACCESS:액세스, REFRESH:리프레시}
        private String accessToken;                       // 토큰값 (SHA-256 해시 저장 권장)
        private LocalDateTime tokenExp;                     // 토큰 만료일시
        private String prevToken;                            // 갱신 전 토큰 해시 (REFRESH 액션 시)
        private String refreshToken;                          // 리프레시 토큰
        private String ip;                                     // IP주소
        private String deviceInfo;                              // User-Agent
        private String revokeReasonCd;                           // 폐기 사유 (LOGOUT/FORCE/EXPIRED 등)
        private LocalDateTime accessTokenExp;                     // 액세스 토큰 만료일시
        private String uiNm;                                       // 화면명 (X-UI-Nm 헤더)
        private String cmdNm;                                       // 기능명 (X-Cmd-Nm 헤더)
        private String regBy;                                        // 등록자
        private LocalDateTime regDate;                               // 등록일시
        private String regSiteId;                                    // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                                         // 수정자
        private LocalDateTime updDate;                                // 수정일시
        private String siteNm;                                         // 사이트명 (조인)
        private String memberNm;                                       // 회원명 (조인)
        private String actionCdNm;                                      // 토큰 액션명 (조인)
        private String tokenTypeCdNm;                                    // 토큰 유형명 (조인)
    }

}
