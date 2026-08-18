package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhApiLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        @Size(max = 20) private String typeCd;  // 유형코드
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_api_log ──────────────────────────────────────────
        private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        private String apiTypeCd;  // 연동유형코드 (PG/LOGISTICS/KAKAO/NAVER/SMS 등)
        private String apiNm;  // API명 (예: 결제승인)
        private String uiNm;  // 화면명 (X-UI-Nm 헤더)
        private String cmdNm;  // 작업명 (X-Cmd-Nm 헤더)
        private String methodCd;  // HTTP 메서드
        private String endpoint;  // 호출 URL
        private String reqBody;  // 요청 파라미터 (민감정보 마스킹 처리)
        private String resBody;  // 응답 본문
        private Integer httpStatus;  // HTTP 응답코드
        private String resultCd;  // 처리결과 (SUCCESS/FAIL)
        private String errorMsg;  // 오류 메시지
        private Integer elapsedMs;  // 응답시간 (밀리초)
        private String refTypeCd;  // 연관유형코드 (ORDER/DLIV/PUSH 등)
        private String refId;  // 연관ID
        private LocalDateTime callDate;  // API 호출일시
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────────
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
