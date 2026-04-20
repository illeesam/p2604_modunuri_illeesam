package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbMemberSnsDto {

    // ── mb_member_sns ──────────────────────────────────────────
    private String memberSnsId;
    private String memberId;
    private String snsChannelCd;
    private String snsUserId;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
