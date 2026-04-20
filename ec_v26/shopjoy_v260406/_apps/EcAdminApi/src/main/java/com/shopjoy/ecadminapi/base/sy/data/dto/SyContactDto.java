package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyContactDto {

    // ── sy_contact ──────────────────────────────────────────
    private String contactId;
    private String siteId;
    private String memberId;
    private String memberNm;
    private String categoryCd;
    private String contactTitle;
    private String contactContent;
    private String attachGrpId;
    private String contactStatusCd;
    private String contactAnswer;
    private String answerUserId;
    private LocalDateTime answerDate;
    private LocalDateTime contactDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
