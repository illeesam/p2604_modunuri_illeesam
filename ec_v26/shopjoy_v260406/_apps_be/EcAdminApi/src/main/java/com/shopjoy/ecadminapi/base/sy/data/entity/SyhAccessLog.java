package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "syh_access_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Comment("API 요청/응답 액세스 로그 (비동기 선택 수집)")
public class SyhAccessLog {

    @Id
    @Comment("PK: AL+yyMMddHHmmss+rand4")
    @Column(name = "log_id", length = 20, nullable = false)
    private String logId;

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

    @Comment("클라이언트 실제 IP")
    @Column(name = "req_ip", length = 45)
    private String reqIp;

    @Comment("User-Agent")
    @Column(name = "req_ua", length = 500)
    private String reqUa;

    @Comment("요청 바디 (설정된 최대 크기까지)")
    @Column(name = "req_body", columnDefinition = "TEXT")
    private String reqBody;

    // ── 인증 정보 ────────────────────────────────────────
    @Comment("호출 앱 유형 (코드: APP_TYPE — FO/BO/SO/DO/CO/-)")
    @Column(name = "app_type_cd", length = 20)
    private String appTypeCd;

    @Comment("인증 사용자 ID")
    @Column(name = "user_id", length = 50)
    private String userId;

    @Comment("역할 ID")
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

    // ── 응답 정보 ────────────────────────────────────────
    @Comment("HTTP 응답 상태 코드")
    @Column(name = "resp_status")
    private Integer respStatus;

    @Comment("요청 처리 시간 (밀리초)")
    @Column(name = "resp_time_ms")
    private Long respTimeMs;

    @Comment("응답 바디 (설정된 최대 크기까지)")
    @Column(name = "resp_body", columnDefinition = "TEXT")
    private String respBody;

    // ── 실행 환경 ────────────────────────────────────────
    @Comment("서버 호스트명")
    @Column(name = "server_nm", length = 100)
    private String serverNm;

    @Comment("활성 Spring 프로파일")
    @Column(name = "profile", length = 50)
    private String profile;

    @Comment("처리 스레드명")
    @Column(name = "thread_nm", length = 100)
    private String threadNm;

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

    // ── 시각 ─────────────────────────────────────────────
    @Comment("요청 수신 시각")
    @Column(name = "req_dt", nullable = false)
    private LocalDateTime reqDt;

    @Comment("DB 저장 시각")
    @Column(name = "reg_date")
    private LocalDateTime regDate;
}
