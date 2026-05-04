package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyhAccessLogDto {

    // ── syh_access_log ──────────────────────────────────────────
    private String logId;

    private String reqMethod;
    private String reqHost;
    private String reqPath;
    private String reqQuery;
    private String reqIp;
    private String reqUa;
    private String reqBody;

    private String appTypeCd;
    private String userId;
    private String roleId;
    private String deptId;
    private String vendorId;
    private String localeId;

    private Integer respStatus;
    private Long    respTimeMs;
    private String  respBody;

    private String serverNm;
    private String profile;
    private String threadNm;

    private String uiNm;
    private String cmdNm;
    private String fileNm;
    private String funcNm;
    private String lineNo;
    private String traceId;

    private LocalDateTime reqDt;
    private LocalDateTime regDate;
}
