package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbMemberGroupDto {

    // ── mb_member_group ──────────────────────────────────────────
    private String groupId;
    private String siteId;
    private String groupNm;
    private String groupMemo;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
