package com.shopjoy.ecadminapi.base.ec.mb.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbDeviceTokenReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String deviceTokenId;
    private String deviceToken;
    private String siteId;
    private String memberId;
    private String osType;
    private String benefitNotiYn;
    private LocalDateTime alimReadDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public MbDeviceToken toEntity() {
        return MbDeviceToken.builder()
                .deviceTokenId(deviceTokenId)
                .deviceToken(deviceToken)
                .siteId(siteId)
                .memberId(memberId)
                .osType(osType)
                .benefitNotiYn(benefitNotiYn)
                .alimReadDate(alimReadDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
