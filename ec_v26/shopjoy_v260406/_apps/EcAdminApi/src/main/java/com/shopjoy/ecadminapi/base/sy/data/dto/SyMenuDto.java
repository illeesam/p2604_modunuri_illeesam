package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyMenuDto {

    // ── sy_menu ──────────────────────────────────────────
    private String menuId;
    private String siteId;
    private String menuCode;
    private String menuNm;
    private String parentMenuId;
    private String menuUrl;
    private String menuTypeCd;
    private String iconClass;
    private Integer sortOrd;
    private String useYn;
    private String menuRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
