package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "syh_access_error_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Comment("HTTP 요청 에러 로그 (비동기 수집)")
public class SyhAccessErrorLog {

    @Id
    @Comment("PK: EL+yyMMddHHmmss+rand4")
    @Column(name = "log_id", length = 20, nullable = false)
    private String logId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    // ── 요청 정보 ────────────────────────────────────────
    @Comment("HTTP 메서드")
    @Column(name = "req_method", length = 10)
    private String reqMethod;

    @Comment("Host 헤더 값")
    @Column(name = "req_host", length = 200)
    private String reqHost;

    @Comment("요청 URI 경로")
    @Column(name = "req_path", length = 500)
    private String reqPath;

    @Comment("쿼리 파라미터 문자열")
    @Column(name = "req_query", length = 1000)
    private String reqQuery;

    @Comment("클라이언트 실제 IP (X-Forwarded-For 우선)")
    @Column(name = "req_ip", length = 45)
    private String reqIp;

    @Comment("User-Agent")
    @Column(name = "req_ua", length = 500)
    private String reqUa;

    // ── 인증 정보 ────────────────────────────────────────
    @Comment("호출 앱 유형 (코드: APP_TYPE — FO/BO/SO/DO/CO/-)")
    @Column(name = "app_type_cd", length = 20)
    private String appTypeCd;

    @Comment("인증 사용자 ID (MDC)")
    @Column(name = "user_id", length = 50)
    private String userId;

    @Comment("역할 ID (MDC)")
    @Column(name = "role_id", length = 50)
    private String roleId;

    @Comment("부서 ID (MDC)")
    @Column(name = "dept_id", length = 50)
    private String deptId;

    @Comment("업체 ID (MDC)")
    @Column(name = "vendor_id", length = 50)
    private String vendorId;

    @Comment("지역 ID (MDC)")
    @Column(name = "locale_id", length = 20)
    private String localeId;

    // ── 경과 시간 ─────────────────────────────────────────
    @Comment("요청 처리 시간 (밀리초)")
    @Column(name = "resp_time_ms")
    private Long respTimeMs;

    // ── 에러 정보 ────────────────────────────────────────
    @Comment("예외 클래스 FQCN")
    @Column(name = "error_type", length = 300)
    private String errorType;

    @Comment("예외 메시지")
    @Column(name = "error_msg", columnDefinition = "TEXT")
    private String errorMsg;

    @Comment("스택 트레이스 (최대 3000자)")
    @Column(name = "stack_trace", columnDefinition = "TEXT")
    private String stackTrace;

    // ── X-헤더 (클라이언트 호출 추적) ────────────────────
    @Column(name = "ui_nm", length = 200)
    private String uiNm;

    @Column(name = "cmd_nm", length = 200)
    private String cmdNm;

    @Column(name = "file_nm", length = 200)
    private String fileNm;

    @Column(name = "func_nm", length = 200)
    private String funcNm;

    @Column(name = "line_no", length = 10)
    private String lineNo;

    @Column(name = "trace_id", length = 50)
    private String traceId;

    // ── 실행 환경 ────────────────────────────────────────
    @Comment("서버 호스트명")
    @Column(name = "server_nm", length = 100)
    private String serverNm;

    @Comment("활성 Spring 프로파일")
    @Column(name = "profile", length = 50)
    private String profile;

    @Comment("로그 발생 스레드명")
    @Column(name = "thread_nm", length = 100)
    private String threadNm;

    @Comment("로거 클래스 이름")
    @Column(name = "logger_nm", length = 200)
    private String loggerNm;

    // ── 시각 ─────────────────────────────────────────────
    @Comment("에러 발생 시각")
    @Column(name = "log_dt", nullable = false)
    private LocalDateTime logDt;

    @Comment("DB 저장 시각")
    @Column(name = "reg_date")
    private LocalDateTime regDate;
}
