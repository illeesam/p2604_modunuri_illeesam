package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "syh_access_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Comment("API 요청/응답 액세스 로그 (비동기 선택 수집)")
public class SyhAccessLog {

    @Id
    @Comment("PK: AL+yyMMddHHmmss+rand4")
    @Column(name = "log_id", length = 20, nullable = false)
    @Size(max = 20, message = "logId 는 20자 이내여야 합니다.")
    private String logId;


    // ── 요청 정보 ────────────────────────────────────────
    @Comment("HTTP 메서드")
    @Column(name = "req_method", length = 10)
    @Size(max = 10, message = "reqMethod 는 10자 이내여야 합니다.")
    private String reqMethod;

    @Comment("Host 헤더 값")
    @Column(name = "req_host", length = 200)
    @Size(max = 100, message = "reqHost 는 100자 이내여야 합니다.")
    private String reqHost;

    @Comment("요청 URI 경로")
    @Column(name = "req_path", length = 500)
    @Size(max = 100, message = "reqPath 는 100자 이내여야 합니다.")
    private String reqPath;

    @Comment("쿼리 파라미터 문자열")
    @Column(name = "req_query", length = 1000)
    @Size(max = 100, message = "reqQuery 는 100자 이내여야 합니다.")
    private String reqQuery;

    @Comment("클라이언트 실제 IP")
    @Column(name = "req_ip", length = 45)
    @Size(max = 45, message = "reqIp 는 45자 이내여야 합니다.")
    private String reqIp;

    @Comment("User-Agent")
    @Column(name = "req_ua", length = 500)
    @Size(max = 100, message = "reqUa 는 100자 이내여야 합니다.")
    private String reqUa;

    @Comment("요청 바디 (설정된 최대 크기까지)")
    @Column(name = "req_body", columnDefinition = "TEXT")
    @Size(max = 50000, message = "reqBody 는 50000자 이내여야 합니다.")
    private String reqBody;

    // ── 인증 정보 ────────────────────────────────────────
    @Comment("호출 앱 유형 (코드: APP_TYPE — FO/BO/SO/DO/CO/-)")
    @Column(name = "app_type_cd", length = 20)
    @Size(max = 20, message = "appTypeCd 는 20자 이내여야 합니다.")
    private String appTypeCd;

    @Comment("인증 사용자 ID")
    @Column(name = "user_id", length = 50)
    @Size(max = 50, message = "userId 는 50자 이내여야 합니다.")
    private String userId;

    @Comment("역할 ID")
    @Column(name = "role_id", length = 50)
    @Size(max = 50, message = "roleId 는 50자 이내여야 합니다.")
    private String roleId;

    @Comment("부서 ID (MDC)")
    @Column(name = "dept_id", length = 50)
    @Size(max = 50, message = "deptId 는 50자 이내여야 합니다.")
    private String deptId;

    @Comment("업체 ID (MDC)")
    @Column(name = "vendor_id", length = 50)
    @Size(max = 50, message = "vendorId 는 50자 이내여야 합니다.")
    private String vendorId;

    @Comment("지역 ID (MDC)")
    @Column(name = "locale_id", length = 20)
    @Size(max = 20, message = "localeId 는 20자 이내여야 합니다.")
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
    @Size(max = 50000, message = "respBody 는 50000자 이내여야 합니다.")
    private String respBody;

    // ── 실행 환경 ────────────────────────────────────────
    @Comment("서버 호스트명")
    @Column(name = "server_nm", length = 100)
    @Size(max = 100, message = "serverNm 는 100자 이내여야 합니다.")
    private String serverNm;

    @Comment("활성 Spring 프로파일")
    @Column(name = "profile", length = 50)
    @Size(max = 50, message = "profile 는 50자 이내여야 합니다.")
    private String profile;

    @Comment("처리 스레드명")
    @Column(name = "thread_nm", length = 100)
    @Size(max = 100, message = "threadNm 는 100자 이내여야 합니다.")
    private String threadNm;

    // ── X-헤더 (클라이언트 호출 추적) ────────────────────
    @Column(name = "ui_nm", length = 200)
    @Size(max = 100, message = "uiNm 는 100자 이내여야 합니다.")
    private String uiNm;

    @Column(name = "cmd_nm", length = 200)
    @Size(max = 100, message = "cmdNm 는 100자 이내여야 합니다.")
    private String cmdNm;

    @Column(name = "file_nm", length = 200)
    @Size(max = 100, message = "fileNm 는 100자 이내여야 합니다.")
    private String fileNm;

    @Column(name = "func_nm", length = 200)
    @Size(max = 100, message = "funcNm 는 100자 이내여야 합니다.")
    private String funcNm;

    @Column(name = "line_no", length = 10)
    @Size(max = 10, message = "lineNo 는 10자 이내여야 합니다.")
    private String lineNo;

    @Column(name = "trace_id", length = 50)
    @Size(max = 50, message = "traceId 는 50자 이내여야 합니다.")
    private String traceId;

    // ── 시각 ─────────────────────────────────────────────
    @Comment("요청 수신 시각")
    @Column(name = "req_dt", nullable = false)
    private LocalDateTime reqDt;

    @Comment("DB 저장 시각")
    @Column(name = "reg_date")
    private LocalDateTime regDate;
}
