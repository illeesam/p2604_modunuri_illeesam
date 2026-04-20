package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdRestockNotiDto {

    // ── pd_restock_noti ──────────────────────────────────────────
    private String restockNotiId;
    private String siteId;
    private String prodId;
    private String skuId;
    private String memberId;
    private String notiYn;
    private LocalDateTime notiDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
