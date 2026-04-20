package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyI18nDto {

    // ── sy_i18n ──────────────────────────────────────────
    private String i18nId;
    private String siteId;
    private String i18nKey;
    private String i18nDesc;
    private String i18nScopeCd;
    private String i18nCategory;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
