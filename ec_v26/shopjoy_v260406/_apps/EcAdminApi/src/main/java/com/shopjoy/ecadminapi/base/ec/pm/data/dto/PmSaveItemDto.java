package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmSaveItemDto {

    // ── pm_save_item ────────────────────────────────────────────
    private String saveItemId;
    private String saveId;
    private String siteId;
    private String targetTypeCd;
    private String targetId;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN ────────────────────────────────────────────────────
    private String siteNm;
    private String targetTypeCdNm;
}
