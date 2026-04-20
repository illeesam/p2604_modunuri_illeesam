package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class MbMemberGradeDto {

    // ── mb_member_grade ──────────────────────────────────────────
    private String gradeId;
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
