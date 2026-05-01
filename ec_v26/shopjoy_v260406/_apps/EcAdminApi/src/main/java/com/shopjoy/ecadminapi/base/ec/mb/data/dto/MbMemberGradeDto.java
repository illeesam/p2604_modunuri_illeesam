package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbMemberGradeDto {

    // ── mb_member_grade ──────────────────────────────────────────
    private String memberGradeId;
    private String siteId;
    private String gradeCd;
    private String gradeNm;
    private Integer gradeRank;
    private Long minPurchaseAmt;
    private BigDecimal saveRate;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
