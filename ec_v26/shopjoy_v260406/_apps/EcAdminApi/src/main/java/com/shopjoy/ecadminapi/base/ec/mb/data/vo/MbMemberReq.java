package com.shopjoy.ecadminapi.base.ec.mb.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbMemberReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String memberId;
    private String siteId;
    private String memberEmail;
    private String memberPassword;
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

    public MbMember toEntity() {
        return MbMember.builder()
                .memberId(memberId)
                .siteId(siteId)
                .memberEmail(memberEmail)
                .memberPassword(memberPassword)
                .memberNm(memberNm)
                .memberPhone(memberPhone)
                .memberGender(memberGender)
                .birthDate(birthDate)
                .gradeCd(gradeCd)
                .memberStatusCd(memberStatusCd)
                .memberStatusCdBefore(memberStatusCdBefore)
                .joinDate(joinDate)
                .lastLogin(lastLogin)
                .orderCount(orderCount)
                .totalPurchaseAmt(totalPurchaseAmt)
                .cacheBalanceAmt(cacheBalanceAmt)
                .memberZipCode(memberZipCode)
                .memberAddr(memberAddr)
                .memberAddrDetail(memberAddrDetail)
                .memberMemo(memberMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
