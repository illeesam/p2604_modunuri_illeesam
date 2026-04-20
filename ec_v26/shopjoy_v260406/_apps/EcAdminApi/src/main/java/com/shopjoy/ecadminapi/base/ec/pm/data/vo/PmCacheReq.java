package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmCacheReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String cacheId;
    private String siteId;
    private String memberId;
    private String memberNm;
    private String cacheTypeCd;
    private Long cacheAmt;
    private Long balanceAmt;
    private String refId;
    private String cacheDesc;
    private String procUserId;
    private LocalDateTime cacheDate;
    private LocalDate expireDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmCache toEntity() {
        return PmCache.builder()
                .cacheId(cacheId)
                .siteId(siteId)
                .memberId(memberId)
                .memberNm(memberNm)
                .cacheTypeCd(cacheTypeCd)
                .cacheAmt(cacheAmt)
                .balanceAmt(balanceAmt)
                .refId(refId)
                .cacheDesc(cacheDesc)
                .procUserId(procUserId)
                .cacheDate(cacheDate)
                .expireDate(expireDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
