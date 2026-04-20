package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyhApiLogDto {

    // ── syh_api_log ──────────────────────────────────────────
    private String logId;
    private String siteId;
    private String apiTypeCd;
    private String apiNm;
    private String methodCd;
    private String endpoint;
    private String reqBody;
    private String resBody;
    private Integer httpStatus;
    private String resultCd;
    private String errorMsg;
    private Integer elapsedMs;
    private String refTypeCd;
    private String refId;
    private LocalDateTime callDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
