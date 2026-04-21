package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "syh_access_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class SyhAccessLog {

    @Id
    @Column(name = "log_id", length = 20, nullable = false)
    private String logId;

    // ── 요청 정보 ────────────────────────────────────────
    @Column(name = "req_method", length = 10)
    private String reqMethod;

    @Column(name = "req_host", length = 200)
    private String reqHost;

    @Column(name = "req_path", length = 500)
    private String reqPath;

    @Column(name = "req_query", length = 1000)
    private String reqQuery;

    @Column(name = "req_ip", length = 45)
    private String reqIp;

    @Column(name = "req_ua", length = 500)
    private String reqUa;

    @Column(name = "req_body", columnDefinition = "TEXT")
    private String reqBody;

    // ── 인증 정보 ────────────────────────────────────────
    @Column(name = "user_type", length = 20)
    private String userType;

    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "role_id", length = 50)
    private String roleId;

    @Column(name = "dept_id", length = 50)
    private String deptId;

    @Column(name = "vendor_id", length = 50)
    private String vendorId;

    @Column(name = "locale_id", length = 20)
    private String localeId;

    // ── 응답 정보 ────────────────────────────────────────
    @Column(name = "resp_status")
    private Integer respStatus;

    @Column(name = "resp_time_ms")
    private Long respTimeMs;

    @Column(name = "resp_body", columnDefinition = "TEXT")
    private String respBody;

    // ── 실행 환경 ────────────────────────────────────────
    @Column(name = "server_nm", length = 100)
    private String serverNm;

    @Column(name = "profile", length = 50)
    private String profile;

    @Column(name = "thread_nm", length = 100)
    private String threadNm;

    // ── 시각 ─────────────────────────────────────────────
    @Column(name = "req_dt", nullable = false)
    private LocalDateTime reqDt;

    @Column(name = "reg_date")
    private LocalDateTime regDate;
}
