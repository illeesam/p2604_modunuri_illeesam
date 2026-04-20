package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmEventItemDto {

    // ── pm_event_item ──────────────────────────────────────────
    private String eventItemId;
    private String eventId;
    private String siteId;
    private String targetTypeCd;
    private String targetId;
    private Integer sortNo;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
