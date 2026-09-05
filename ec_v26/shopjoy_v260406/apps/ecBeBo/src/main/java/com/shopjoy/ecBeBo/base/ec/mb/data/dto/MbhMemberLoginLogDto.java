package com.shopjoy.ecBeBo.base.ec.mb.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MbhMemberLoginLogDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;           // 사이트ID 필터
        @Size(max = 21) private String logId;            // 로그ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String logId;                       // 로그ID (YYMMDDhhmmss+rand4)
        private String memberId;                     // 회원ID (로그인 실패 시 NULL)
        private String loginId;                       // 입력한 로그인ID (이메일)
        private LocalDateTime loginDate;               // 로그인 시도일시
        private String resultCd;                        // 결과 — LOGIN_RESULT
        private Integer failCnt;                         // 해당 시점 연속 실패 횟수
        private String ip;                                // IP주소
        private String device;                             // User-Agent 전문
        private String os;                                  // OS 정보
        private String browser;                              // 브라우저 정보
        private String country;                               // 국가코드 (GeoIP)
        private String accessToken;                            // 액세스 토큰 (SHA-256 해시값, 로그인 실패 시 NULL)
        private LocalDateTime accessTokenExp;                   // 액세스 토큰 만료일시
        private String refreshToken;                             // 리프레시 토큰 (SHA-256 해시값)
        private LocalDateTime refreshTokenExp;                    // 리프레시 토큰 만료일시
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
        private String resultCdNm;   // 로그인결과 코드명 — 단건 상세조회(selectById)에서만 채워짐
    }

}
