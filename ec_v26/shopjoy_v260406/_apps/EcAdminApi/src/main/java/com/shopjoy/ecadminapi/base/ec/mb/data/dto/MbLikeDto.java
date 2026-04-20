package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbLikeDto {

    // ── mb_like ──────────────────────────────────────────
    private String likeId;
    private String siteId;
    private String memberId;
    private String targetTypeCd;
    private String targetId;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
