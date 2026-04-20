package com.shopjoy.ecadminapi.base.ec.mb.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbMemberAddrReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String addrId;
    private String siteId;
    private String memberId;
    private String addrNm;
    private String recvNm;
    private String recvPhone;
    private String zipCd;
    private String addr;
    private String addrDetail;
    private String isDefault;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public MbMemberAddr toEntity() {
        return MbMemberAddr.builder()
                .addrId(addrId)
                .siteId(siteId)
                .memberId(memberId)
                .addrNm(addrNm)
                .recvNm(recvNm)
                .recvPhone(recvPhone)
                .zipCd(zipCd)
                .addr(addr)
                .addrDetail(addrDetail)
                .isDefault(isDefault)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
