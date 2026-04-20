package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 회원 주소 DTO
public class MbMemberAddrDto {
    private String addrId;
    private String memberId;
    private String addrNm;
    private String recvNm;
    private String recvPhone;
    private String zipCode;
    private String addr;
    private String addrDetail;
    private String defaultYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
}
