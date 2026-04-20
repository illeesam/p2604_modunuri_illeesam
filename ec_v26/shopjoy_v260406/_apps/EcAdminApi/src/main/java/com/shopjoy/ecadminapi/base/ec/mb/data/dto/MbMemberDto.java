package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 회원 DTO
public class MbMemberDto {

    // ── mb_member ────────────────────────────────────────────────
    private String memberId;
    private String siteId;
    private String memberEmail;
    private String memberNm;
    private String memberPhone;
    private String memberGender;
    private LocalDate birthDate;
    private String gradeCd;
    private String memberStatusCd;
    private String memberStatusCdBefore;
    private LocalDateTime joinDate;
    private LocalDateTime lastLogin;
    private Integer orderCount;
    private Long totalPurchaseAmt;
    private Long cacheBalanceAmt;
    private String memberZipCode;
    private String memberAddr;
    private String memberAddrDetail;
    private String memberMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: sy_site ────────────────────────────────────────────
    private String siteNm;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String gradeCdNm;
    private String memberStatusCdNm;
}
