package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmSaveDto {

    // ── pm_save ──────────────────────────────────────────
    private String saveId;
    private String siteId;
    private String memberId;
    private String saveTypeCd;
    private Long saveAmt;
    private Long balanceAmt;
    private String refTypeCd;
    private String refId;
    private LocalDateTime expireDate;
    private String saveMemo;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
