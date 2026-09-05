package com.shopjoy.ecBeBo.base.sy.data.entity;

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
    @Size(max = 200, message = "reqHost 는 200자 이내여야 합니다.")
    private String reqHost;

    @Comment("요청 URI 경로")
    @Column(name = "req_path", length = 500)
    @Size(max = 500, message = "reqPath 는 500자 이내여야 합니다.")
    private String reqPath;

    @Comment("쿼리 파라미터 문자열")
    @Column(name = "req_query", length = 1000)
    @Size(max = 1000, message = "reqQuery 는 1000자 이내여야 합니다.")
    private String reqQuery;

    @Comment("클라이언트 실제 IP")
    @Column(name = "req_ip", length = 45)
    @Size(max = 45, message = "reqIp 는 45자 이내여야 합니다.")
    private String reqIp;

    /* @Size 는 @Column length 와 항상 일치시킨다 — reqUa 는 AccessLogFilter 가 truncate(ua, 500) 로
       500자까지 잘라 넣는데 @Size 가 100으로 더 좁게 박혀 있어서 100~500자 UA(요즘 브라우저는 흔함)
       마다 ConstraintViolationException 으로 커밋이 실패했다(2026-08-20 실제 발생 확인).
       이 파일의 uiNm/cmdNm/fileNm/funcNm 도 같은 원인(컬럼보다 좁은 @Size)이라 함께 맞춘다. */
    @Comment("User-Agent")
    @Column(name = "req_ua", length = 500)
    @Size(max = 500, message = "reqUa 는 500자 이내여야 합니다.")
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
    @Size(max = 200, message = "uiNm 는 200자 이내여야 합니다.")
    private String uiNm;

    @Column(name = "cmd_nm", length = 200)
    @Size(max = 200, message = "cmdNm 는 200자 이내여야 합니다.")
    private String cmdNm;

    @Column(name = "file_nm", length = 200)
    @Size(max = 200, message = "fileNm 는 200자 이내여야 합니다.")
    private String fileNm;

    @Column(name = "func_nm", length = 200)
    @Size(max = 200, message = "funcNm 는 200자 이내여야 합니다.")
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

    /* 2026-08-20: reg_site_id 필드를 여기 추가했다가 되돌림 — _doc/ddl_pgsql/sy/syh_access_log.sql
       추출본엔 reg_site_id NOT NULL 이 있었지만, 실제 라이브 DB(illeesam.synology.me:17632/shopjoy_2604)
       의 syh_access_log 테이블엔 그 컬럼이 없다(정보 스키마 직접 조회로 확인). 문서가 stale 했던 것.
       Entity 필드가 실제로 없는 컬럼을 참조하면 Hibernate 가 SELECT 에 그 컬럼명을 넣어
       "column ... does not exist" 로 매 건 실패한다 — DDL 문서보다 실제 DB 를 신뢰할 것. */
}
