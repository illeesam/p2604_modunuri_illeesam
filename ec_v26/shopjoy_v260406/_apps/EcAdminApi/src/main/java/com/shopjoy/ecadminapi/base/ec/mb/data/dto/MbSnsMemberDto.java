package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbSnsMemberDto {

    // ── mb_sns_member ──────────────────────────────────────────
    private String snsMemId;
    private String memberId;
    private String snsChannelCd;
    private String snsUserId;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
