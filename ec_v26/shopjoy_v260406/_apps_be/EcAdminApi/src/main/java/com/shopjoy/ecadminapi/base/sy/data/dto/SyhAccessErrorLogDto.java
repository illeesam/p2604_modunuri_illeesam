package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhAccessErrorLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 10) private String method;  // HTTP 메서드 검색값
        @Size(max = 200) private String path;  // 요청 URI 경로 검색값
        @Size(max = 20) private String appTypeCd;  // 호출 앱 유형 검색값 — APP_TYPE {ADMIN:관리자, MEMBER:회원, VENDOR:업체, BO:관리자(BO), FO:사용자(FO)}
        @Size(max = 200) private String uiNm;  // 호출 화면명(X-UI-Nm) 검색값
        @Size(max = 100) private String traceId;  // 요청 추적ID 검색값
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_access_error_log ────────────────────────────────────
        private String logId;  // PK: EL+yyMMddHHmmss+rand4

        private String reqMethod;  // HTTP 메서드
        private String reqHost;  // Host 헤더 값
        private String reqPath;  // 요청 URI 경로
        private String reqQuery;  // 쿼리 파라미터 문자열
        private String reqIp;  // 클라이언트 실제 IP (X-Forwarded-For 우선)
        private String reqUa;  // User-Agent

        private String appTypeCd;  // 호출 앱 유형 — APP_TYPE {ADMIN:관리자, MEMBER:회원, VENDOR:업체, BO:관리자(BO), FO:사용자(FO)}
        private String userId;  // 인증 사용자 ID (MDC)
        private String roleId;  // 역할 ID (MDC)
        private String deptId;  // 부서 ID (MDC)
        private String vendorId;  // 업체 ID (MDC)
        private String localeId;  // 지역 ID (MDC)

        private Long   respTimeMs;  // 요청 처리 시간 (밀리초)

        private String errorType;  // 예외 클래스 FQCN
        private String errorMsg;  // 예외 메시지
        private String stackTrace;  // 스택 트레이스 (최대 3000자)

        private String uiNm;  // 호출 화면명 (X-UI-Nm)
        private String cmdNm;  // 호출 명령명 (X-Cmd-Nm)
        private String fileNm;  // 호출 파일명 (X-헤더)
        private String funcNm;  // 호출 함수명 (X-헤더)
        private String lineNo;  // 호출 라인번호 (X-헤더)
        private String traceId;  // 요청 추적ID

        private String serverNm;  // 서버 호스트명
        private String profile;  // 활성 Spring 프로파일
        private String threadNm;  // 로그 발생 스레드명
        private String loggerNm;  // 로거 클래스 이름

        private LocalDateTime logDt;  // 에러 발생 시각
        private LocalDateTime regDate;  // DB 저장 시각
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)

        // ── 조인 파생 (코드명/연관명) — 단건 상세조회(selectById)에서만 채워짐 ──
        private String appTypeCdNm;  // 호출 앱 유형 코드명 (JOIN)
        private String userNm;  // 사용자명 (JOIN)
        private String roleNm;  // 역할명 (JOIN)
        private String deptNm;  // 부서명 (JOIN)
        private String vendorNm;  // 업체명 (JOIN)
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
